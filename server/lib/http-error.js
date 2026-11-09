export class HttpError extends Error {
    constructor(status, message, code = 'REQUEST_FAILED') {
        super(message);
        this.status = status;
        this.code = code;
    }
}

export function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);
    const known = error instanceof HttpError;
    res.status(known ? error.status : 500).json({
        message: known ? error.message : 'Something went wrong. Please try again.',
        code: known ? error.code : 'INTERNAL_ERROR',
    });
}
