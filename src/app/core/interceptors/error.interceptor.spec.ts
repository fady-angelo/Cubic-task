import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isAppHttpError } from '../errors/app-http-error';
import { errorInterceptor, toAppHttpError } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
  });

  it('maps GET 500 to AppHttpError with a user-facing message and does not swallow it', async () => {
    const pending = firstValueFrom(http.get(`${environment.baseUrl}/payments`));
    backend
      .expectOne(`${environment.baseUrl}/payments`)
      .flush(
        { code: 'UNEXPECTED_ERROR', message: 'Unavailable' },
        { status: 500, statusText: 'Server Error' },
      );

    const error = await pending.then(
      () => null,
      (reason: unknown) => reason,
    );
    expect(isAppHttpError(error)).toBe(true);
    if (!isAppHttpError(error)) {
      return;
    }
    expect(error.kind).toBe('server');
    expect(error.status).toBe(500);
    expect(error.message).toBe('Unavailable');
  });

  it('uses the default server message when GET 500 has no API body', async () => {
    const pending = firstValueFrom(http.get(`${environment.baseUrl}/payments`));
    backend.expectOne(`${environment.baseUrl}/payments`).flush('fail', {
      status: 500,
      statusText: 'Server Error',
    });

    const error = await pending.then(
      () => null,
      (reason: unknown) => reason,
    );
    expect(isAppHttpError(error)).toBe(true);
    if (!isAppHttpError(error)) {
      return;
    }
    expect(error.kind).toBe('server');
    expect(error.message).toBe('An unexpected error occurred. Please try again.');
  });

  it('does not retry a failed POST mutation', async () => {
    const pending = firstValueFrom(
      http.post(`${environment.baseUrl}/payments`, { clientRequestId: 'req-1' }),
    );
    backend
      .expectOne(`${environment.baseUrl}/payments`)
      .flush(
        { code: 'UNEXPECTED_ERROR', message: 'Unavailable' },
        { status: 500, statusText: 'Server Error' },
      );

    const error = await pending.then(
      () => null,
      (reason: unknown) => reason,
    );
    expect(isAppHttpError(error)).toBe(true);
    backend.expectNone(`${environment.baseUrl}/payments`);
  });
});

describe('toAppHttpError', () => {
  it('preserves 409 field payload for feature handling', () => {
    const mapped = toAppHttpError(
      new HttpErrorResponse({
        status: 409,
        error: { code: 'STALE', message: 'Conflict', currentRowVersion: 8 },
      }),
    );
    expect(mapped.kind).toBe('conflict');
    expect(mapped.apiError?.currentRowVersion).toBe(8);
  });

  it('preserves 422 field errors', () => {
    const mapped = toAppHttpError(
      new HttpErrorResponse({
        status: 422,
        error: {
          code: 'VALIDATION',
          message: 'Invalid',
          fieldErrors: { amount: 'Required' },
        },
      }),
    );
    expect(mapped.kind).toBe('validation');
    expect(mapped.apiError?.fieldErrors?.['amount']).toBe('Required');
  });
});
