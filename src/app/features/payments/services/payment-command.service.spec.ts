import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { errorInterceptor } from '../../../core/interceptors/error.interceptor';
import { PaymentType } from '../shared/enums/payment.enums';
import { PaymentCommandService } from './payment-command.service';

describe('PaymentCommandService', () => {
  let commands: PaymentCommandService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    commands = TestBed.inject(PaymentCommandService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('POSTs submit with rowVersion and clientRequestId', () => {
    commands.submit('pay-021', { rowVersion: 1, clientRequestId: 'req-1' }).subscribe();
    const req = http.expectOne(`${environment.baseUrl}/payments/pay-021/submit`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rowVersion: 1, clientRequestId: 'req-1' });
    req.flush({
      id: 'pay-021',
      reference: 'PAY-2026-00061',
      status: 'PENDING_CHECK',
      makerUserId: 'usr-maker-1',
      rowVersion: 2,
    });
  });

  it('POSTs a checker decision with rowVersion', () => {
    commands
      .decide('pay-020', {
        rowVersion: 2,
        clientRequestId: 'req-2',
        decision: 'RETURN',
        reason: 'Missing invoice',
      })
      .subscribe();
    const req = http.expectOne(`${environment.baseUrl}/payments/pay-020/decision`);
    expect(req.request.body.decision).toBe('RETURN');
    expect(req.request.body.rowVersion).toBe(2);
    expect(req.request.body.reason).toBe('Missing invoice');
    req.flush({
      id: 'pay-020',
      reference: 'PAY-2026-00060',
      status: 'RETURNED',
      makerUserId: 'usr-maker-2',
      rowVersion: 3,
    });
  });

  it('POSTs a new payment draft', () => {
    const payload = {
      clientRequestId: 'req-create',
      type: PaymentType.Domestic,
      debtorAccountId: 'acc-4412',
      beneficiary: { name: 'Acme Supplies Ltd', account: 'GB12ACME000004412' },
      currency: 'GBP',
      amount: 10.12,
      executionDate: '2026-12-01',
      purposeCode: 'SUPP',
      remittanceInformation: 'Invoice 12',
    };
    commands.create(payload).subscribe();

    const req = http.expectOne(`${environment.baseUrl}/payments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      id: 'pay-099',
      reference: 'PAY-2026-00099',
      status: 'DRAFT',
      makerUserId: 'usr-maker-1',
      rowVersion: 1,
    });
  });

  it('PUTs an existing payment draft', () => {
    commands
      .update('pay-021', {
        clientRequestId: 'req-update',
        rowVersion: 1,
        type: PaymentType.Domestic,
        debtorAccountId: 'acc-4412',
        beneficiary: { name: 'Acme Supplies Ltd', account: 'GB12ACME000004412' },
        currency: 'GBP',
        amount: 10.12,
        executionDate: '2026-12-01',
        purposeCode: 'SUPP',
        remittanceInformation: 'Invoice 12',
      })
      .subscribe();

    const req = http.expectOne(`${environment.baseUrl}/payments/pay-021`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.rowVersion).toBe(1);
    expect(req.request.body.clientRequestId).toBe('req-update');
    req.flush({
      id: 'pay-021',
      reference: 'PAY-2026-00061',
      status: 'DRAFT',
      makerUserId: 'usr-maker-1',
      rowVersion: 2,
    });
  });

  it('POSTs cancel with rowVersion and clientRequestId', () => {
    commands.cancelDraft('pay-021', { rowVersion: 1, clientRequestId: 'req-a' }).subscribe();
    const req = http.expectOne(`${environment.baseUrl}/payments/pay-021/cancel`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rowVersion: 1, clientRequestId: 'req-a' });
    req.flush({
      id: 'pay-021',
      reference: 'PAY-2026-00061',
      status: 'CANCELLED',
      makerUserId: 'usr-maker-1',
      rowVersion: 2,
    });
  });
});
