import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { createPaymentService, createPaymentRouter, monthWindow } from '../lib/payments.js';
import { createApplicationService } from '../lib/applications.js';
import { requireSeeker } from '../lib/seeker-auth.js';
import { errorHandler } from '../lib/http-error.js';

const clientUrl = 'http://localhost:3000';
const priceId = 'price_seeker';
const baseTime = new Date('2026-11-09T12:00:00.000Z');

function stripeFixture() {
    const state = {
        price: { active: true, type: 'recurring', unit_amount: 1400, currency: 'usd', recurring: { interval: 'month', interval_count: 1 } },
        sessions: new Map(),
        subscriptions: new Map(),
        attempts: new Map(),
        created: [],
        lineItems: [{ price: { id: priceId }, quantity: 1 }],
        subscriptionError: null,
    };
    const stripe = {
        prices: { retrieve: async () => state.price },
        subscriptions: { retrieve: async (id) => {
            if (state.subscriptionError) throw state.subscriptionError;
            const subscription = state.subscriptions.get(id);
            assert.ok(subscription, 'mock subscription exists');
            return subscription;
        } },
        checkout: { sessions: {
            retrieve: async (id) => {
                if (!state.sessions.has(id)) throw Object.assign(new Error('Not found'), { type: 'StripeInvalidRequestError' });
                return state.sessions.get(id);
            },
            listLineItems: async () => ({ data: state.lineItems }),
            create: async (params, options) => {
                state.created.push(params);
                if (state.attempts.has(options.idempotencyKey)) return state.attempts.get(options.idempotencyKey);
                const session = { id: `cs_test_created${state.created.length}`, status: 'open', url: 'https://checkout.stripe.com/c/pay/test', metadata: params.metadata };
                state.sessions.set(session.id, session);
                state.attempts.set(options.idempotencyKey, session);
                return session;
            },
        } },
    };
    return { stripe, state };
}

test('monthly quota uses UTC boundaries, including year rollover', () => {
    const range = monthWindow(new Date('2026-12-31T23:59:59.999Z'));
    assert.equal(range.start.toISOString(), '2026-12-01T00:00:00.000Z');
    assert.equal(range.end.toISOString(), '2027-01-01T00:00:00.000Z');
});

test('configured price must be active, fixed, positive, and monthly recurring', async () => {
    const { stripe, state } = stripeFixture();
    const service = createPaymentService({ stripe, database: { collection: () => ({}) }, priceId, clientUrl });
    assert.deepEqual(await service.getPlan(), { name: 'Seeker Pro', amountMinor: 1400, currency: 'usd', interval: 'month', freeApplicationLimit: 5 });
    for (const change of [{ active: false }, { type: 'one_time' }, { unit_amount: null }, { unit_amount: 0 }, { recurring: { interval: 'year', interval_count: 1 } }, { recurring: { interval: 'month', interval_count: 2 } }]) {
        const original = state.price;
        state.price = { ...original, ...change };
        await assert.rejects(service.getPlan(), { code: 'PAYMENT_CONFIGURATION' });
        state.price = original;
    }
});

test('auth verifies cookies through the fixed BetterAuth origin and uses the database role', async () => {
    const user = { _id: new ObjectId(), role: 'recruiter' };
    let fetched = false;
    const middleware = requireSeeker({ users: { findOne: async () => user }, clientUrl, fetchSession: async (url, options) => {
        fetched = true;
        assert.ok(url.startsWith(`${clientUrl}/api/auth/get-session?`));
        assert.equal(options.headers.cookie, 'signed-session-cookie');
        return Response.json({ user: { id: user._id.toHexString(), role: 'seeker' }, session: { expiresAt: '2099-01-01T00:00:00Z' } });
    } });
    const invoke = async (headers) => {
        let error;
        await middleware({ get: (name) => headers[name] }, { set() {} }, (value) => { error = value; });
        return error;
    };
    assert.equal((await invoke({})).code, 'UNAUTHENTICATED');
    assert.equal((await invoke({ origin: 'https://untrusted.example', cookie: 'signed-session-cookie' })).code, 'INVALID_ORIGIN');
    assert.equal(fetched, false);
    assert.equal((await invoke({ origin: clientUrl, cookie: 'signed-session-cookie' })).code, 'SEEKER_REQUIRED');
    assert.equal(fetched, true);
});

test('auth service outages return retryable errors', async () => {
    const middleware = requireSeeker({ users: {}, clientUrl, fetchSession: async () => { throw new Error('Unavailable'); } });
    let failure;
    await middleware({ get: (name) => name === 'cookie' ? 'cookie' : undefined }, { set() {} }, (error) => { failure = error; });
    assert.equal(failure.status, 503);
    assert.equal(failure.code, 'AUTH_UNAVAILABLE');
});

const mongoUri = process.env.TEST_MONGO_DB_URI || process.env.MONGO_DB_URI;
test('payment and quota integration on a disposable MongoDB database', { skip: !mongoUri, timeout: 60000 }, async (t) => {
    const databaseName = `hireloop_payment_test_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const database = client.db(databaseName);
    let server;
    try {
        await database.collection('transactions').createIndex({ sessionId: 1 }, { unique: true });
        await database.collection('applications').createIndex({ userId: 1, appliedAt: 1 });
        const { stripe, state } = stripeFixture();
        let now = baseTime;
        const payments = createPaymentService({ stripe, client, database, priceId, clientUrl, clock: () => now });
        const submit = createApplicationService({ client, database, payments, clock: () => now });
        const authenticate = requireSeeker({ users: database.collection('user'), clientUrl, fetchSession: async (url, options) => {
            const id = options.headers.cookie.match(/^test_user=([a-f0-9]{24})$/)?.[1];
            return Response.json(id ? { user: { id }, session: { expiresAt: '2099-01-01T00:00:00Z' } } : null);
        } });
        const app = express();
        app.use(express.json());
        app.use(createPaymentRouter({ payments, authenticate }));
        app.post('/applications', authenticate, async (req, res) => res.status(201).json(await submit(req.user, req.body)));
        app.use(errorHandler);
        server = app.listen(0, '127.0.0.1');
        await new Promise((resolve) => server.once('listening', resolve));
        const origin = `http://127.0.0.1:${server.address().port}`;
        async function request(path, user, payload) {
            const response = await fetch(`${origin}${path}`, {
                method: payload === undefined ? 'GET' : 'POST',
                headers: { ...(user ? { cookie: `test_user=${user._id.toHexString()}` } : {}), 'content-type': 'application/json' },
                ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
            });
            return { status: response.status, data: await response.json() };
        }
        async function fixture(role = 'seeker') {
            const user = { _id: new ObjectId(), name: 'Test Seeker', email: `${randomUUID()}@example.test`, role, plan: 'free' };
            const job = { _id: new ObjectId(), title: 'Engineer', companyName: 'Test Company', jobType: 'full-time', isRemote: true, location: 'Dhaka', minSalary: '1000', maxSalary: '2000', salaryFrequency: 'per month', deadline: '2027-01-01' };
            await database.collection('user').insertOne(user);
            await database.collection('jobs').insertOne(job);
            return { user, job };
        }
        function paidSession(user, suffix = randomUUID().replaceAll('-', '')) {
            const subscription = { id: `sub_${suffix}`, customer: `cus_${suffix}`, status: 'active', start_date: Math.floor(now.getTime() / 1000), created: Math.floor(now.getTime() / 1000), cancel_at_period_end: false, items: { data: [{ price: { id: priceId }, current_period_end: Math.floor(now.getTime() / 1000) + 31 * 86400 }] } };
            const session = { id: `cs_test_${suffix}`, mode: 'subscription', status: 'complete', payment_status: 'paid', customer: subscription.customer, subscription: subscription.id, metadata: { userId: user._id.toHexString(), role: 'seeker' }, amount_total: 1400, currency: 'usd', created: Math.floor(now.getTime() / 1000) };
            state.subscriptions.set(subscription.id, subscription);
            state.sessions.set(session.id, session);
            return { session, subscription };
        }

        await t.test('protected APIs reject guests, recruiters, and invalid cookies', async () => {
            assert.equal((await request('/payments/me')).status, 401);
            const { user } = await fixture('recruiter');
            assert.equal((await request('/create-checkout-session', user, {})).status, 403);
            const response = await fetch(`${origin}/payments/me`, { headers: { cookie: 'invalid' } });
            assert.equal(response.status, 401);
        });

        await t.test('checkout derives user and price server-side and reuses an open session', async () => {
            const { user } = await fixture();
            const first = await request('/create-checkout-session', user, { userId: 'forged', email: 'forged@example.test', role: 'admin', priceId: 'price_fake' });
            assert.equal(first.status, 200);
            assert.equal(state.created.at(-1).metadata.userId, user._id.toHexString());
            assert.equal(state.created.at(-1).customer_email, user.email);
            assert.equal(state.created.at(-1).line_items[0].price, priceId);
            const count = state.created.length;
            assert.deepEqual(await request('/create-checkout-session', user, {}), first);
            assert.equal(state.created.length, count);
        });

        await t.test('verification rejects missing, unknown, foreign, unpaid, and wrong-price sessions', async () => {
            const { user } = await fixture();
            const other = (await fixture()).user;
            const { session } = paidSession(user);
            assert.equal((await request('/payments/verify', user)).status, 400);
            assert.equal((await request('/payments/verify?session_id=cs_test_unknown', user)).status, 400);
            assert.equal((await request(`/payments/verify?session_id=${session.id}`, other)).status, 403);
            session.payment_status = 'unpaid';
            assert.equal((await request(`/payments/verify?session_id=${session.id}`, user)).data.code, 'PAYMENT_NOT_COMPLETED');
            session.payment_status = 'paid';
            state.lineItems = [{ price: { id: 'price_wrong' }, quantity: 1 }];
            assert.equal((await request(`/payments/verify?session_id=${session.id}`, user)).data.code, 'PRICE_MISMATCH');
            state.lineItems = [{ price: { id: priceId }, quantity: 1 }];
            assert.equal(await database.collection('transactions').countDocuments({ userId: user._id.toHexString() }), 0);
            assert.equal((await database.collection('user').findOne({ _id: user._id })).plan, 'free');
        });

        await t.test('simultaneous checkout requests claim one attempt and one Stripe session', async () => {
            const { user } = await fixture();
            const results = await Promise.all(Array.from({ length: 4 }, () => request('/create-checkout-session', user, {})));
            assert.ok(results.every((result) => result.status === 200));
            const attempts = [...state.attempts.keys()].filter((key) => key.includes(user._id.toHexString()));
            assert.equal(attempts.length, 1);
        });

        await t.test('concurrent verification and refresh save one transaction and preserve plan dates', async () => {
            const { user } = await fixture();
            const { session } = paidSession(user);
            const results = await Promise.all([request(`/payments/verify?session_id=${session.id}`, user), request(`/payments/verify?session_id=${session.id}`, user)]);
            assert.ok(results.every((result) => result.status === 200 && result.data.plan === 'pro'));
            const saved = await database.collection('user').findOne({ _id: user._id });
            assert.equal((await request('/create-checkout-session', user, {})).data.code, 'ALREADY_PRO');
            await request(`/payments/verify?session_id=${session.id}`, user);
            assert.equal(await database.collection('transactions').countDocuments({ sessionId: session.id }), 1);
            assert.equal((await database.collection('user').findOne({ _id: user._id })).planStartedAt.getTime(), saved.planStartedAt.getTime());
            const billing = await request('/payments/me', user);
            assert.equal(billing.data.transactions[0].amountMinor, 1400);
            assert.equal(billing.data.usage.limit, null);
        });

        await t.test('free applications use trusted snapshots and the sixth is rejected', async () => {
            const { user, job } = await fixture();
            const forged = { jobId: job._id.toHexString(), userId: 'forged', email: 'forged@example.test', appliedAt: '2000-01-01', status: 'offered', archived: true, jobTitle: 'Fake' };
            for (let i = 0; i < 5; i++) assert.equal((await request('/applications', user, forged)).status, 201);
            assert.equal((await request('/applications', user, forged)).data.code, 'FREE_PLAN_LIMIT_REACHED');
            const application = await database.collection('applications').findOne({ userId: user._id.toHexString() });
            assert.equal(application.email, user.email);
            assert.equal(application.jobTitle, job.title);
            assert.equal(application.appliedAt, baseTime.toISOString());
            assert.equal(application.status, 'applied');
            assert.equal(application.archived, false);
        });

        await t.test('concurrent sixth applications cannot bypass the quota; archived/BSON dates count', async () => {
            const { user, job } = await fixture();
            await database.collection('applications').insertMany(Array.from({ length: 4 }, (_, index) => ({ userId: user._id.toHexString(), appliedAt: index % 2 ? baseTime : baseTime.toISOString(), archived: true })));
            const results = await Promise.all(Array.from({ length: 4 }, () => request('/applications', user, { jobId: job._id.toHexString() })));
            assert.equal(results.filter((result) => result.status === 201).length, 1);
            assert.equal(results.filter((result) => result.data.code === 'FREE_PLAN_LIMIT_REACHED').length, 3);
            assert.equal(await database.collection('applications').countDocuments({ userId: user._id.toHexString() }), 5);
        });

        await t.test('failed insertion rolls back the user write and quota resets at the UTC month boundary', async () => {
            const { user, job } = await fixture();
            assert.equal((await request('/applications', user, { jobId: new ObjectId().toHexString() })).status, 404);
            assert.equal((await database.collection('user').findOne({ _id: user._id })).applicationSubmissionVersion, undefined);
            await database.collection('applications').insertMany(Array.from({ length: 5 }, () => ({ userId: user._id.toHexString(), appliedAt: baseTime.toISOString() })));
            now = new Date('2026-12-01T00:00:00.000Z');
            assert.equal((await request('/applications', user, { jobId: job._id.toHexString() })).status, 201);
            now = baseTime;
        });

        await t.test('active Pro is unlimited, scheduled cancellation preserves access, expired/unpaid subscriptions do not', async () => {
            const { user, job } = await fixture();
            const { session, subscription } = paidSession(user);
            await request(`/payments/verify?session_id=${session.id}`, user);
            subscription.cancel_at_period_end = true;
            assert.equal((await request('/payments/me', user)).data.plan, 'pro');
            const results = await Promise.all(Array.from({ length: 7 }, () => request('/applications', user, { jobId: job._id.toHexString() })));
            assert.ok(results.every((result) => result.status === 201));
            subscription.status = 'past_due';
            assert.equal((await request('/create-checkout-session', user, {})).data.code, 'SUBSCRIPTION_REQUIRES_ATTENTION');
            assert.equal((await request('/applications', user, { jobId: job._id.toHexString() })).data.code, 'FREE_PLAN_LIMIT_REACHED');
            subscription.status = 'active';
            subscription.items.data[0].current_period_end = Math.floor(baseTime.getTime() / 1000);
            assert.equal((await request('/payments/me', user)).data.plan, 'free');
            assert.equal((await request(`/payments/verify?session_id=${session.id}`, user)).data.plan, 'free');
        });

        await t.test('Stripe outage preserves saved Pro state and returns a retryable failure', async () => {
            const { user, job } = await fixture();
            const { session } = paidSession(user);
            await request(`/payments/verify?session_id=${session.id}`, user);
            state.subscriptionError = new Error('Stripe unavailable');
            assert.equal((await request('/payments/me', user)).status, 503);
            assert.equal((await request('/applications', user, { jobId: job._id.toHexString() })).status, 503);
            assert.equal((await database.collection('user').findOne({ _id: user._id })).plan, 'pro');
            state.subscriptionError = null;
        });

        await t.test('a seeker can resubscribe after cancellation, but an old success URL cannot replace the new plan', async () => {
            const { user } = await fixture();
            const first = paidSession(user);
            await request(`/payments/verify?session_id=${first.session.id}`, user);
            first.subscription.status = 'canceled';
            now = new Date(baseTime.getTime() + 86400 * 1000);
            assert.equal((await request('/create-checkout-session', user, {})).status, 200);
            const next = paidSession(user);
            assert.equal((await request(`/payments/verify?session_id=${next.session.id}`, user)).data.plan, 'pro');
            assert.equal((await request(`/payments/verify?session_id=${first.session.id}`, user)).status, 409);
            assert.equal((await database.collection('user').findOne({ _id: user._id })).stripeSubscriptionId, next.subscription.id);
            now = baseTime;
        });
    } finally {
        if (server) {
            server.closeAllConnections();
            await new Promise((resolve) => server.close(resolve));
        }
        assert.ok(databaseName.startsWith('hireloop_payment_test_'));
        try {
            await database.dropDatabase();
        } finally {
            await client.close();
        }
    }
});
