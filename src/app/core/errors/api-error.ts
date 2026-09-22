export interface ApiError {
  code: string;
  message: string;
  currentRowVersion?: number;
  fieldErrors?: Record<string, string>;
}

export type AppHttpErrorKind =
  'unauthorized' | 'forbidden' | 'conflict' | 'validation' | 'server' | 'unknown';

export interface AppHttpError extends Error {
  readonly kind: AppHttpErrorKind;
  readonly status: number;
  readonly apiError?: ApiError;
}
