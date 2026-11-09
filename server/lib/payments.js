import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { HttpError } from './http-error.js';

export const FREE_APPLICATION_LIMIT = 5;

export function monthWindow(now = new Date()) {
    return {
        start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
        end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
    };
}

export function applicationMonthFilter(userId, now) {
    const { start, end } = monthWindow(now);
    return {
        userId,
        $or: [
            { appliedAt: { $gte: start.toISOString(), $lt: end.toISOString() } },
            { appliedAt: { $gte: start, $lt: end } },
        ],
    };
}

const stripeId = (value) => typeof value === 'string' ? value : value?.id;

export function createPaymentService({ stripe, client, database, priceId, clientUrl, clock = () => new Date() }) {
    const users = database.collection('user');
    const transactions = database.collection('transactions');
    const applications = database.collection('applications');

    async function stripeRequest(action) {
        try {
            return await action();
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw new HttpError(503, 'Payment services are unavailable. Please try again.', 'STRIPE_UNAVAILABLE');
        }
    }

    async function getPlan() {
        if (!priceId || !stripe) throw new HttpError(503, 'Seeker Pro payments have not been configured.', 'PAYMENT_CONFIGURATION');
        const price = await stripeRequest(() => stripe.prices.retrieve(priceId));
        if (!price.active || price.type !== 'recurring' || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1 || !Number.isInteger(price.unit_amount) || price.unit_amount <= 0) {
            throw new HttpError(503, 'Seeker Pro requires an active monthly recurring price.', 'PAYMENT_CONFIGURATION');
        }
        return { name: 'Seeker Pro', amountMinor: price.unit_amount, currency: price.currency, interval: 'month', freeApplicationLimit: FREE_APPLICATION_LIMIT };
    }

    function subscriptionState(subscription) {
        const item = subscription.items?.data?.find((entry) => stripeId(entry.price) === priceId);
        const periodEnd = item?.current_period_end ?? subscription.current_period_end;
        const active = subscription.status === 'active' && !subscription.pause_collection && periodEnd * 1000 > clock().getTime();
        return {
            plan: active && item ? 'pro' : 'free',
            subscriptionStatus: subscription.status,
            planValidUntil: periodEnd ? new Date(periodEnd * 1000) : null,
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        };
    }

    async function getEntitlement(user) {
        if (!user.stripeSubscriptionId) return { plan: 'free', subscriptionStatus: null, planValidUntil: null, cancelAtPeriodEnd: false };
        const subscription = await stripeRequest(() => stripe.subscriptions.retrieve(user.stripeSubscriptionId));
        if (stripeId(subscription.customer) !== user.stripeCustomerId) throw new HttpError(503, 'Subscription details could not be verified.', 'SUBSCRIPTION_MISMATCH');
        const state = subscriptionState(subscription);
        const result = await users.updateOne({ _id: user._id, stripeSubscriptionId: user.stripeSubscriptionId }, { $set: state });
        if (!result.matchedCount) {
            const latestUser = await users.findOne({ _id: user._id });
            if (!latestUser) throw new HttpError(401, 'Please sign in again.', 'UNAUTHENTICATED');
            return getEntitlement(latestUser);
        }
        return state;
    }

    async function verify(user, sessionId) {
        if (typeof sessionId !== 'string' || !/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId) || sessionId.length > 255) {
            throw new HttpError(400, 'A valid Checkout session is required.', 'INVALID_SESSION');
        }
        let checkout;
        try {
            checkout = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
        } catch (error) {
            if (error.type === 'StripeInvalidRequestError') throw new HttpError(400, 'This Checkout session could not be found.', 'INVALID_SESSION');
            throw new HttpError(503, 'Payment verification is unavailable. Please retry.', 'STRIPE_UNAVAILABLE');
        }
        const userId = user._id.toHexString();
        if (checkout.metadata?.userId !== userId || checkout.metadata?.role !== 'seeker') throw new HttpError(403, 'This payment belongs to another account.', 'SESSION_OWNER_MISMATCH');
        if (checkout.mode !== 'subscription' || checkout.status !== 'complete' || checkout.payment_status !== 'paid' || !checkout.subscription) {
            throw new HttpError(400, 'Payment has not been completed.', 'PAYMENT_NOT_COMPLETED');
        }
        const items = await stripeRequest(() => stripe.checkout.sessions.listLineItems(sessionId, { limit: 2 }));
        if (items.data.length !== 1 || stripeId(items.data[0].price) !== priceId || items.data[0].quantity !== 1) throw new HttpError(400, 'This payment is not for Seeker Pro.', 'PRICE_MISMATCH');
        const subscription = typeof checkout.subscription === 'string'
            ? await stripeRequest(() => stripe.subscriptions.retrieve(checkout.subscription)) : checkout.subscription;
        if (stripeId(subscription.customer) !== stripeId(checkout.customer)) throw new HttpError(400, 'Subscription details could not be verified.', 'SUBSCRIPTION_MISMATCH');
        const state = subscriptionState(subscription);
        if (user.stripeSubscriptionId && user.stripeSubscriptionId !== subscription.id) await getEntitlement(user);
        const mongoSession = client.startSession();
        try {
            await mongoSession.withTransaction(async () => {
                const currentUser = await users.findOneAndUpdate({ _id: user._id }, { $inc: { paymentVersion: 1 } }, { session: mongoSession, returnDocument: 'after' });
                if (!currentUser) throw new HttpError(401, 'Please sign in again.', 'UNAUTHENTICATED');
                // A return visit to an older payment must not replace a newer subscription.
                if (currentUser.stripeSubscriptionId && currentUser.stripeSubscriptionId !== subscription.id &&
                    (currentUser.plan === 'pro' || checkout.created * 1000 < new Date(currentUser.planStartedAt).getTime())) {
                    throw new HttpError(409, 'Your account already has a different subscription. Open Billing to view it.', 'SUBSCRIPTION_CONFLICT');
                }
                await users.updateOne({ _id: user._id }, {
                    $set: {
                        ...state,
                        stripeCustomerId: stripeId(checkout.customer),
                        stripeSubscriptionId: subscription.id,
                        planStartedAt: new Date((subscription.start_date ?? subscription.created) * 1000),
                    },
                    ...(currentUser.pendingCheckoutSessionId === sessionId ? { $unset: { pendingCheckoutSessionId: '', checkoutAttemptId: '' } } : {}),
                }, { session: mongoSession });
                await transactions.updateOne({ sessionId }, { $setOnInsert: {
                    userId,
                    email: user.email,
                    role: 'seeker',
                    planName: 'Seeker Pro',
                    amountMinor: checkout.amount_total,
                    currency: checkout.currency,
                    sessionId,
                    paymentStatus: checkout.payment_status,
                    createdAt: new Date(checkout.created * 1000),
                } }, { upsert: true, session: mongoSession });
            });
        } finally {
            await mongoSession.endSession();
        }
        return { ...state, planName: 'Seeker Pro', message: 'Payment verified.' };
    }

    async function checkout(user) {
        await getPlan();
        const state = await getEntitlement(user);
        if (state.plan === 'pro') throw new HttpError(409, 'You already have Seeker Pro. Open Billing to view your plan.', 'ALREADY_PRO');
        if (state.subscriptionStatus && !['canceled', 'incomplete_expired'].includes(state.subscriptionStatus)) {
            throw new HttpError(409, 'Your existing subscription needs attention before you can start a new one. View its status in Billing.', 'SUBSCRIPTION_REQUIRES_ATTENTION');
        }
        if (user.pendingCheckoutSessionId) {
            const pending = await stripeRequest(() => stripe.checkout.sessions.retrieve(user.pendingCheckoutSessionId));
            if (pending.status === 'open' && pending.url) return { url: pending.url };
            if (pending.status === 'complete' && pending.payment_status === 'paid') {
                const verified = await verify(user, pending.id);
                if (verified.plan === 'pro') throw new HttpError(409, 'Your payment is confirmed. Open Billing to view Seeker Pro.', 'ALREADY_PRO');
            }
            if (pending.status === 'expired') {
                await users.updateOne({ _id: user._id, pendingCheckoutSessionId: pending.id }, { $unset: { pendingCheckoutSessionId: '', checkoutAttemptId: '' } });
            }
        }
        // Claim an attempt atomically; concurrent requests and network retries use
        // the same Stripe idempotency key until this checkout completes/expires.
        const checkoutUser = await users.findOneAndUpdate({ _id: user._id }, [
            { $set: { checkoutAttemptId: { $ifNull: ['$checkoutAttemptId', randomUUID()] } } },
        ], { returnDocument: 'after' });
        if (!checkoutUser) throw new HttpError(401, 'Please sign in again.', 'UNAUTHENTICATED');
        if (checkoutUser.plan === 'pro' && checkoutUser.planValidUntil > clock()) throw new HttpError(409, 'You already have Seeker Pro. Open Billing to view your plan.', 'ALREADY_PRO');
        if (checkoutUser.pendingCheckoutSessionId && checkoutUser.pendingCheckoutSessionId !== user.pendingCheckoutSessionId) {
            const pending = await stripeRequest(() => stripe.checkout.sessions.retrieve(checkoutUser.pendingCheckoutSessionId));
            if (pending.status === 'open' && pending.url) return { url: pending.url };
        }
        const session = await stripeRequest(() => stripe.checkout.sessions.create({
            mode: 'subscription',
            allowed_payment_method_types: ['card'],
            ...(checkoutUser.stripeCustomerId ? { customer: checkoutUser.stripeCustomerId } : { customer_email: checkoutUser.email }),
            client_reference_id: user._id.toHexString(),
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: { userId: user._id.toHexString(), role: 'seeker', planName: 'Seeker Pro' },
            subscription_data: { metadata: { userId: user._id.toHexString(), role: 'seeker' } },
            success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/payment/cancel`,
        }, { idempotencyKey: `seeker-pro:${user._id.toHexString()}:${priceId}:${checkoutUser.checkoutAttemptId}` }));
        if (!session.url) throw new HttpError(503, 'Checkout is unavailable. Please retry.', 'CHECKOUT_UNAVAILABLE');
        await users.updateOne({ _id: user._id }, { $set: { pendingCheckoutSessionId: session.id } });
        return { url: session.url };
    }

    async function billing(user) {
        const state = await getEntitlement(user);
        const now = clock();
        const used = await applications.countDocuments(applicationMonthFilter(user._id.toHexString(), now));
        const history = await transactions.find({ userId: user._id.toHexString() }).sort({ createdAt: -1 }).toArray();
        return {
            ...state,
            usage: { used, limit: state.plan === 'pro' ? null : FREE_APPLICATION_LIMIT, resetAt: monthWindow(now).end },
            transactions: history.map((transaction) => ({ id: transaction._id.toHexString(), planName: transaction.planName, amountMinor: transaction.amountMinor, currency: transaction.currency, paymentStatus: transaction.paymentStatus, createdAt: transaction.createdAt })),
        };
    }

    return { getPlan, getEntitlement, checkout, verify, billing };
}

export function createPaymentRouter({ payments, authenticate }) {
    const router = Router();
    router.get('/payments/seeker-plan', async (req, res) => {
        res.set('Cache-Control', 'no-store');
        res.json(await payments.getPlan());
    });
    router.post('/create-checkout-session', authenticate, async (req, res) => res.json(await payments.checkout(req.user)));
    router.get('/payments/verify', authenticate, async (req, res) => res.json(await payments.verify(req.user, req.query.session_id)));
    router.get('/payments/me', authenticate, async (req, res) => res.json(await payments.billing(req.user)));
    return router;
}
