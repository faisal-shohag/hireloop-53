import { ObjectId } from 'mongodb';
import { HttpError } from './http-error.js';

export function requireSeeker({ users, clientUrl, fetchSession = fetch }) {
    return async (req, res, next) => {
        try {
            res.set('Cache-Control', 'no-store');
            const origin = req.get('origin');
            if (origin && origin !== clientUrl) {
                throw new HttpError(403, 'This request origin is not allowed.', 'INVALID_ORIGIN');
            }
            const cookie = req.get('cookie');
            if (!cookie) throw new HttpError(401, 'Please sign in to continue.', 'UNAUTHENTICATED');

            let response;
            try {
                response = await fetchSession(`${clientUrl}/api/auth/get-session?disableCookieCache=true&disableSessionRefresh=true`, {
                    headers: { cookie },
                    cache: 'no-store',
                    signal: AbortSignal.timeout(8000),
                });
            } catch {
                throw new HttpError(503, 'Sign-in verification is unavailable. Please retry.', 'AUTH_UNAVAILABLE');
            }
            if (!response.ok) throw new HttpError(503, 'Sign-in verification is unavailable. Please retry.', 'AUTH_UNAVAILABLE');
            const session = await response.json();
            const id = session?.user?.id;
            const expiresAt = new Date(session?.session?.expiresAt).getTime();
            if (!id || !ObjectId.isValid(id) || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
                throw new HttpError(401, 'Please sign in to continue.', 'UNAUTHENTICATED');
            }
            const user = await users.findOne({ _id: new ObjectId(id) });
            if (!user) throw new HttpError(401, 'Please sign in to continue.', 'UNAUTHENTICATED');
            if (user.role !== 'seeker') throw new HttpError(403, 'This feature is available to job seekers.', 'SEEKER_REQUIRED');
            req.user = user;
            next();
        } catch (error) {
            next(error);
        }
    };
}
