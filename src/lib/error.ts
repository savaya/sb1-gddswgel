export class ApiError extends Error {
    constructor(
        public statusCode: number, // Changed from status to statusCode
        message: string,
        public originalError?: unknown,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export function handleApiError(error: unknown): ApiError {
    if (error instanceof ApiError) {
        return error;
    }

    if (error instanceof Error) {
        // MongoDB specific errors
        if (error.name === 'MongoServerError') {
            if ((error as any).code === 11000) {
                return new ApiError(409, 'Duplicate entry found', error);
            }
        }

        // Mongoose validation errors
        if (error.name === 'ValidationError') {
            return new ApiError(400, 'Validation failed', error);
        }

        return new ApiError(500, error.message, error);
    }

    return new ApiError(500, 'An unexpected error occurred', error);
}
