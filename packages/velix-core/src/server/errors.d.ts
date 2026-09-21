export declare class VelixHttpError extends Error {
    status: number;
    digest?: string;
    constructor(status: number, message: string);
    toClientError(isDev: boolean): {
        message: string;
        status: number;
        digest: string | undefined;
        stack: string | undefined;
    };
}
export declare class NotFoundError extends VelixHttpError {
    constructor(message?: string);
}
export declare class ForbiddenError extends VelixHttpError {
    constructor(message?: string);
}
export declare class UnauthorizedError extends VelixHttpError {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map