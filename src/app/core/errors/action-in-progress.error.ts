export class ActionInProgressError extends Error {
  constructor() {
    super('An action is already in progress.');
    this.name = 'ActionInProgressError';
  }
}

export function isActionInProgressError(error: unknown): error is ActionInProgressError {
  return error instanceof ActionInProgressError;
}
