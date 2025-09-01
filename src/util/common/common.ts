// errors/BaseError.ts
export class ServiceError extends Error {
    public status: number;
    public source: string;

    constructor(message: string, statusCode: number, source: string) {
        super(message);

        Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain

        this.status = statusCode;
        this.source = source;

        Error.captureStackTrace(this);
    }
}
