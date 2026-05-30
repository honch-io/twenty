import { describe, expect, it } from 'vitest';

import { extractBearerToken } from '@/server/httpAuth';

describe('extractBearerToken', () => {
  it('extracts the token from a Bearer header', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123');
  });

  it('is case-insensitive on the scheme and trims whitespace', () => {
    expect(extractBearerToken('bearer   abc123  ')).toBe('abc123');
  });

  it('returns undefined when the header is missing or malformed', () => {
    expect(extractBearerToken(undefined)).toBeUndefined();
    expect(extractBearerToken('abc123')).toBeUndefined();
    expect(extractBearerToken('Bearer ')).toBeUndefined();
    expect(extractBearerToken('Basic abc')).toBeUndefined();
  });

  it('handles array header values', () => {
    expect(extractBearerToken(['Bearer abc123'])).toBe('abc123');
  });
});
