import { isAppHttpError } from './app-http-error';

const UNEXPECTED_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

export function messageFromError(error: unknown): string | null {
  if (!error) {
    return null;
  }
  if (isAppHttpError(error)) {
    return error.message;
  }
  return UNEXPECTED_ERROR_MESSAGE;
}
