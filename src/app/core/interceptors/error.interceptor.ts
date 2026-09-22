import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError, AppHttpError } from '../errors/api-error';
import { createAppHttpError, isAppHttpError, kindFromStatus } from '../errors/app-http-error';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (isAppHttpError(error)) {
        return throwError(() => error);
      }
      if (error instanceof HttpErrorResponse) {
        return throwError(() => toAppHttpError(error));
      }
      return throwError(() => error);
    }),
  );

export function toAppHttpError(error: HttpErrorResponse): AppHttpError {
  const apiError = isApiError(error.error) ? error.error : undefined;
  return createAppHttpError(kindFromStatus(error.status), error.status, apiError);
}

function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as ApiError;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
}
