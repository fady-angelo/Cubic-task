import { ApiError, AppHttpError, AppHttpErrorKind } from './api-error';

const APP_HTTP_ERROR_NAME = 'AppHttpError';

export function createAppHttpError(
  kind: AppHttpErrorKind,
  status: number,
  apiError?: ApiError,
): AppHttpError {
  return Object.assign(new Error(apiError?.message ?? defaultMessage(kind)), {
    name: APP_HTTP_ERROR_NAME,
    kind,
    status,
    apiError,
  });
}

export function isAppHttpError(error: unknown): error is AppHttpError {
  return error instanceof Error && error.name === APP_HTTP_ERROR_NAME;
}

export function kindFromStatus(status: number): AppHttpErrorKind {
  switch (status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 409:
      return 'conflict';
    case 422:
      return 'validation';
    case 500:
      return 'server';
    default:
      return 'unknown';
  }
}

function defaultMessage(kind: AppHttpErrorKind): string {
  if (kind === 'server') {
    return 'An unexpected error occurred. Please try again.';
  }
  return 'Request failed. Please try again.';
}
