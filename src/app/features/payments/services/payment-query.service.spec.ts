import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, Component, inject, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { PaymentListQuery, PaymentListResponse } from '../models/payment-list.models';
import { PAYMENT_LIST_PAGE_SIZE } from '../queue/utils/payment-list-query.constants';
import { PaymentQueryService } from './payment-query.service';

@Component({
  selector: 'app-payment-query-service-host',
  template: '',
})
class PaymentQueryServiceHost {
  private readonly paymentQuery = inject(PaymentQueryService);
  readonly paymentListQuery = signal<PaymentListQuery>({
    page: 1,
    pageSize: PAYMENT_LIST_PAGE_SIZE,
    q: 'acme',
  });
  readonly paymentId = signal('pay-021');
  readonly paymentListResource = this.paymentQuery.getPaymentListResource(() =>
    this.paymentListQuery(),
  );
  readonly paymentDetailResource = this.paymentQuery.getPaymentDetailResource(() =>
    this.paymentId(),
  );
}

describe('PaymentQueryService', () => {
  let fixture: ComponentFixture<PaymentQueryServiceHost>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentQueryServiceHost],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PaymentQueryServiceHost);
  });

  afterEach(() => {
    http.verify();
  });

  it('GETs /api/payments with page, pageSize, and q', () => {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();

    const req = http.expectOne((request) => request.url === `${environment.baseUrl}/payments`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe(String(PAYMENT_LIST_PAGE_SIZE));
    expect(req.request.params.get('q')).toBe('acme');
    req.flush(emptyPage());
    http.expectOne(`${environment.baseUrl}/payments/pay-021`).flush({
      id: 'pay-021',
      reference: 'PAY-2026-00061',
      type: { value: 'DOMESTIC', label: 'Domestic' },
      status: { value: 'DRAFT', label: 'Draft' },
      makerUserId: 'usr-maker-1',
      makerName: 'Sara Malik',
      debtorAccount: { id: 'acc-4412', masked: '**** 4412' },
      beneficiary: { name: 'Elm Street Printers' },
      currency: 'GBP',
      amount: 430.12,
      rowVersion: 1,
      audit: [],
    });
  });

  it('GETs /api/payments/:id for the payment detail resource', () => {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    http
      .expectOne((request) => request.url === `${environment.baseUrl}/payments`)
      .flush(emptyPage());

    const req = http.expectOne(`${environment.baseUrl}/payments/pay-021`);
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 'pay-021',
      reference: 'PAY-2026-00061',
      type: { value: 'DOMESTIC', label: 'Domestic' },
      status: { value: 'DRAFT', label: 'Draft' },
      makerUserId: 'usr-maker-1',
      makerName: 'Sara Malik',
      debtorAccount: { id: 'acc-4412', masked: '**** 4412' },
      beneficiary: { name: 'Elm Street Printers' },
      currency: 'GBP',
      amount: 430.12,
      rowVersion: 1,
      audit: [],
    });
  });
});

function emptyPage(): PaymentListResponse {
  return { items: [], total: 0, page: 1, pageSize: PAYMENT_LIST_PAGE_SIZE };
}
