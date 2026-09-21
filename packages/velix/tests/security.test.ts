import { describe, it, expect } from 'vitest';
import { deserializeArgs } from '../actions/index.js';

describe('Server Action Security & Input Validation', () => {
  it('allows normal object payloads with inherited constructor', () => {
    const payload = [{ name: 'Velix User', role: 'admin' }];
    expect(() => deserializeArgs(payload)).not.toThrow();
  });

  it('rejects prototype pollution via own __proto__ property', () => {
    const maliciousPayload = [JSON.parse('{"__proto__": {"admin": true}}')];
    expect(() => deserializeArgs(maliciousPayload)).toThrow(/prototype pollution attempt/);
  });

  it('rejects prototype pollution via own constructor property', () => {
    const maliciousObj = {};
    Object.defineProperty(maliciousObj, 'constructor', {
      value: { prototype: { pollute: true } },
      enumerable: true,
      configurable: true,
      writable: true,
    });
    expect(() => deserializeArgs([maliciousObj])).toThrow(/prototype pollution attempt/);
  });

  it('rejects unallowed serialized $$type', () => {
    const invalidType = [{ $$type: 'MaliciousClass', data: {} }];
    expect(() => deserializeArgs(invalidType)).toThrow(/Invalid serialized type/);
  });

  it('deserializes valid Date objects correctly', () => {
    const dateStr = '2026-09-21T12:00:00.000Z';
    const payload = [{ $$type: 'Date', value: dateStr }];
    const result = deserializeArgs(payload);
    expect(result[0]).toBeInstanceOf(Date);
    expect((result[0] as Date).toISOString()).toBe(dateStr);
  });

  it('rejects invalid Date strings', () => {
    const payload = [{ $$type: 'Date', value: 'invalid-date-string' }];
    expect(() => deserializeArgs(payload)).toThrow(/Invalid date/);
  });
});
