import crypto from 'crypto';

export class VelixHttpError extends Error {
  public status: number;
  public digest?: string;

  constructor(status: number, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    
    // Generate actual cryptographic hash
    const hash = crypto.createHash('sha256');
    hash.update(`${Date.now()}-${message}-${status}-${Math.random()}`);
    this.digest = hash.digest('hex').substring(0, 16);
  }

  toClientError(isDev: boolean) {
    return {
      message: this.message,
      status: this.status,
      digest: this.digest,
      stack: isDev ? this.stack : undefined,
    };
  }
}

export class NotFoundError extends VelixHttpError {
  constructor(message: string = 'Not Found') {
    super(404, message);
  }
}

export class ForbiddenError extends VelixHttpError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}

export class UnauthorizedError extends VelixHttpError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}
