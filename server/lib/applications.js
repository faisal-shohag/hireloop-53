import { ObjectId } from 'mongodb';
import { HttpError } from './http-error.js';
import { applicationMonthFilter, FREE_APPLICATION_LIMIT } from './payments.js';

export function createApplicationService({ client, database, payments, clock = () => new Date() }) {
    const users = database.collection('user');
    const jobs = database.collection('jobs');
    const applications = database.collection('applications');

    return async (user, payload) => {
        if (typeof payload?.jobId !== 'string' || !ObjectId.isValid(payload.jobId)) throw new HttpError(400, 'A valid job is required.', 'INVALID_JOB');
        const entitlement = await payments.getEntitlement(user);
        const mongoSession = client.startSession();
        try {
            return await mongoSession.withTransaction(async () => {
                // Writing the same user document serializes concurrent quota checks.
                const currentUser = await users.findOneAndUpdate({ _id: user._id }, { $inc: { applicationSubmissionVersion: 1 } }, { session: mongoSession, returnDocument: 'after' });
                if (!currentUser || currentUser.role !== 'seeker') throw new HttpError(403, 'A job seeker account is required.', 'SEEKER_REQUIRED');
                if (currentUser.stripeSubscriptionId !== user.stripeSubscriptionId) throw new HttpError(503, 'Your plan has changed. Please retry your application.', 'PLAN_CHANGED');
                const now = clock();
                const isPro = entitlement.plan === 'pro' && entitlement.planValidUntil > now;
                const used = await applications.countDocuments(applicationMonthFilter(user._id.toHexString(), now), { session: mongoSession });
                if (!isPro && used >= FREE_APPLICATION_LIMIT) throw new HttpError(403, 'You have used your 5 free applications this month. Upgrade to Seeker Pro to keep applying.', 'FREE_PLAN_LIMIT_REACHED');
                const job = await jobs.findOne({ _id: new ObjectId(payload.jobId) }, { session: mongoSession });
                if (!job) throw new HttpError(404, 'This job could not be found.', 'JOB_NOT_FOUND');
                const application = {
                    jobId: job._id.toHexString(),
                    userId: currentUser._id.toHexString(),
                    email: currentUser.email,
                    jobTitle: job.title,
                    companyName: job.companyName,
                    jobType: job.jobType,
                    isRemote: job.isRemote,
                    location: job.location,
                    minSalary: job.minSalary,
                    maxSalary: job.maxSalary,
                    salaryFrequency: job.salaryFrequency,
                    deadline: job.deadline,
                    appliedAt: now.toISOString(),
                    status: 'applied',
                    archived: false,
                };
                return applications.insertOne(application, { session: mongoSession });
            });
        } finally {
            await mongoSession.endSession();
        }
    };
}
