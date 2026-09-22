import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { ActionInProgressError } from '../../../../core/errors/action-in-progress.error';
import { errorInterceptor } from '../../../../core/interceptors/error.interceptor';
import { BulkPaymentCommandService } from './bulk-payment-command.service';

describe('BulkPaymentCommandService', () => {
  let commands: BulkPaymentCommandService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    commands = TestBed.inject(BulkPaymentCommandService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('POSTs CSV and clientRequestId once', () => {
    commands.submit('csv-body', 'req-1').subscribe();
    const req = http.expectOne(`${environment.baseUrl}/bulk-payments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ csv: 'csv-body', clientRequestId: 'req-1' });
    req.flush({
      batchId: 'bulk-1',
      receivedRows: 1,
      acceptedRows: 1,
      rejectedRows: [],
      status: 'ACCEPTED',
    });
  });

  it('rejects a second submit while one is in flight', () => {
    const errors: unknown[] = [];
    commands.submit('a', 'req-1').subscribe();
    commands.submit('b', 'req-2').subscribe({ error: (error: unknown) => errors.push(error) });
    http.expectOne(`${environment.baseUrl}/bulk-payments`).flush({
      batchId: 'bulk-1',
      receivedRows: 1,
      acceptedRows: 1,
      rejectedRows: [],
      status: 'ACCEPTED',
    });
    expect(errors[0]).toBeInstanceOf(ActionInProgressError);
  });
});
