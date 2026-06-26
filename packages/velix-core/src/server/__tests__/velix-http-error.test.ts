import { describe, it, expect } from 'vitest';
import {
  VelixHttpError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from '../errors';

describe('VelixHttpError', () => {
  it('sets status and message correctly', () => {
    const err = new VelixHttpError(400, 'Bad request');
    expect(err.status).toBe(400);
    expect(err.message).toBe('Bad request');
    expect(err.name).toBe('VelixHttpError');
  });

  it('generates a 16-char hex digest', () => {
    const err = new VelixHttpError(500, 'Server error');
    expect(err.digest).toBeDefined();
    expect(err.digest!.length).toBe(16);
    expect(/^[0-9a-f]{16}$/.test(err.digest!)).toBe(true);
  });

  it('generates unique digests for each instance', () => {
    const err1 = new VelixHttpError(500, 'same message');
    const err2 = new VelixHttpError(500, 'same message');
    // Should be unique due to Date.now + Math.random
    expect(err1.digest).not.toBe(err2.digest);
  });

  describe('toClientError', () => {
    it('includes stack in dev mode', () => {
      const err = new VelixHttpError(500, 'crash');
      const client = err.toClientError(true);
      expect(client.stack).toBeDefined();
      expect(client.message).toBe('crash');
      expect(client.status).toBe(500);
      expect(client.digest).toBe(err.digest);
    });

    it('strips stack in prod mode', () => {
      const err = new VelixHttpError(500, 'crash');
      const client = err.toClientError(false);
      expect(client.stack).toBeUndefined();
      expect(client.message).toBe('crash');
    });
  });
});

describe('NotFoundError', () => {
  it('defaults to 404 status and "Not Found" message', () => {
    const err = new NotFoundError();
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not Found');
    expect(err.name).toBe('NotFoundError');
  });

  it('accepts a custom message', () => {
    const err = new NotFoundError('Product not found');
    expect(err.message).toBe('Product not found');
  });

  it('is instance of VelixHttpError', () => {
    expect(new NotFoundError()).toBeInstanceOf(VelixHttpError);
  });
});

describe('ForbiddenError', () => {
  it('defaults to 403 status', () => {
    const err = new ForbiddenError();
    expect(err.status).toBe(403);
    expect(err.name).toBe('ForbiddenError');
  });

  it('is instance of VelixHttpError', () => {
    expect(new ForbiddenError()).toBeInstanceOf(VelixHttpError);
  });
});

describe('UnauthorizedError', () => {
  it('defaults to 401 status', () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
    expect(err.name).toBe('UnauthorizedError');
  });

  it('is instance of VelixHttpError', () => {
    expect(new UnauthorizedError()).toBeInstanceOf(VelixHttpError);
  });
});
