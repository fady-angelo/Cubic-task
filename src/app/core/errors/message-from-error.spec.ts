import { createAppHttpError } from './app-http-error';
import { messageFromError } from './message-from-error';

describe('messageFromError', () => {
  it('returns null when there is no error', () => {
    expect(messageFromError(null)).toBeNull();
    expect(messageFromError(undefined)).toBeNull();
  });

  it('returns the API message for an AppHttpError', () => {
    expect(
      messageFromError(createAppHttpError('conflict', 409, { code: 'STALE', message: 'Stale' })),
    ).toBe('Stale');
  });

  it('returns a fallback for unexpected errors', () => {
    expect(messageFromError(new Error('boom'))).toBe(
      'An unexpected error occurred. Please try again.',
    );
  });
});
