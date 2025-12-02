export type AppErrorKind = "NetworkError" | "ServerError" | "AuthError" | "ValidationError" | "UnknownError";

export type AppError = {
    kind: AppErrorKind;
    message: string;
    code?: string;
    cause?: unknown;
    retryable?: boolean;
};

export function createAppError(kind: AppErrorKind, message: string, extras: Partial<AppError> = {}): AppError {
    return {
        kind,
        message,
        ...extras,
    };
}

export function isAppError(error: unknown): error is AppError {
    return typeof error === "object" && error !== null && "kind" in error && "message" in error;
}

export function normalizeError(
    error: unknown,
    fallbackMessage = "오류가 발생했어요. 잠시 후 다시 시도해주세요.",
): AppError {
    if (isAppError(error)) {
        return error;
    }

    if (error instanceof Error) {
        return createAppError("UnknownError", error.message || fallbackMessage, { cause: error });
    }

    return createAppError("UnknownError", fallbackMessage, { cause: error });
}

export function shouldRetry(error: AppError | null | undefined) {
    if (!error) {
        return false;
    }
    if (typeof error.retryable === "boolean") {
        return error.retryable;
    }
    return error.kind === "NetworkError" || error.kind === "ServerError";
}
