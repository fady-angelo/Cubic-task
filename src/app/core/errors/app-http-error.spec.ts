import { createAppHttpError, isAppHttpError, kindFromStatus } from './app-http-error';

describe('kindFromStatus', () => {
  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [409, 'conflict'],
    [422, 'validation'],
    [500, 'server'],
    [418, 'unknown'],
  ] as const)('maps %s to %s', (status, kind) => {
    expect(kindFromStatus(status)).toBe(kind);
  });
});

describe('createAppHttpError', () => {
  it('uses the API message and is recognized by the type guard', () => {
    const error = createAppHttpError('conflict', 409, {
      code: 'STALE',
      message: 'Conflict',
    });
    expect(error.message).toBe('Conflict');
    expect(error.kind).toBe('conflict');
    expect(isAppHttpError(error)).toBe(true);
    expect(isAppHttpError(new Error('no'))).toBe(false);
  });
});
