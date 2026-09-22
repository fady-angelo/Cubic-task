import { ActionInProgressError, isActionInProgressError } from './action-in-progress.error';

describe('ActionInProgressError', () => {
  it('is identifiable', () => {
    const error = new ActionInProgressError();
    expect(isActionInProgressError(error)).toBe(true);
    expect(isActionInProgressError(new Error('no'))).toBe(false);
  });
});
