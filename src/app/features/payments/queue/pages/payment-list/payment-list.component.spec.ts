import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { errorInterceptor } from '../../../../../core/interceptors/error.interceptor';
import { Entitlement } from '../../../../../core/session/enums/entitlement';
import { UserRole } from '../../../../../core/session/enums/user-role';
import { CurrentUser } from '../../../../../core/session/models/current-user';
import { PaymentStatus, PaymentType } from '../../../shared/enums/payment.enums';
import { PaymentSummary } from '../../../models/payment-list.models';
import { PAYMENT_LIST_DEBOUNCE_MS, PAYMENT_LIST_PAGE_SIZE } from '../../payment-list.constants';
import { PaymentListComponent } from './payment-list.component';

describe('PaymentListComponent', () => {
  let fixture: ComponentFixture<PaymentListComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentListComponent],
      providers: [
        provideRouter([
          { path: '', component: PaymentListComponent },
          { path: 'payments/:id', component: PaymentListComponent },
        ]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PaymentListComponent);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads one page from GET /api/payments', async () => {
    const listReq = await renderQueue({
      items: [],
      total: 0,
      page: 1,
      pageSize: PAYMENT_LIST_PAGE_SIZE,
    });

    expect(listReq.request.params.get('page')).toBe('1');
    expect(listReq.request.params.get('pageSize')).toBe(String(PAYMENT_LIST_PAGE_SIZE));
    expect(fixture.nativeElement.textContent).toContain('No payments found');
  });

  it('never renders more rows than pageSize even when total is 20000', async () => {
    const items = Array.from({ length: PAYMENT_LIST_PAGE_SIZE }, (_, index) =>
      summary(`pay-${index}`),
    );
    const listReq = await renderQueue({
      items,
      total: 20_000,
      page: 1,
      pageSize: PAYMENT_LIST_PAGE_SIZE,
    });

    expect(listReq.request.params.get('pageSize')).toBe('20');
    expect(fixture.componentInstance.payments().length).toBe(PAYMENT_LIST_PAGE_SIZE);
    expect(fixture.componentInstance.total()).toBe(20_000);
  });

  it('puts search in the URL and resets page to 1', async () => {
    await renderQueue({ items: [], total: 0, page: 1, pageSize: 20 });

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.filterForm.controls.search.setValue('acme');
    await new Promise((resolve) => setTimeout(resolve, PAYMENT_LIST_DEBOUNCE_MS + 20));

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({ q: 'acme', page: 1 }),
      }),
    );
  });

  it('keeps only the latest search result when queries overlap', async () => {
    await renderQueue({ items: [], total: 0, page: 1, pageSize: 20 });
    const router = TestBed.inject(Router);

    await router.navigate([], { queryParams: { q: 'old', page: 1, pageSize: 20 } });
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    await router.navigate([], { queryParams: { q: 'new', page: 1, pageSize: 20 } });
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();

    const requests = http.match((req) => req.url === `${environment.baseUrl}/payments`);
    const cancelled = requests.filter((req) => req.cancelled);
    const live = requests.filter((req) => !req.cancelled);
    expect(cancelled.length).toBeGreaterThan(0);
    expect(live).toHaveLength(1);
    expect(live[0].request.params.get('q')).toBe('new');
    live[0].flush({
      items: [summary('fresh')],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    await settle();
    expect(fixture.componentInstance.payments().map((row: PaymentSummary) => row.id)).toEqual([
      'fresh',
    ]);
  });

  it('shows create and bulk actions for a Maker', async () => {
    await renderQueue({ items: [], total: 0, page: 1, pageSize: 20 }, makerUser());
    expect(fixture.nativeElement.textContent).toContain('New payment');
    expect(fixture.nativeElement.textContent).toContain('Upload bulk payments');
  });

  it('hides mutating actions for a Checker and explains review', async () => {
    await renderQueue({ items: [], total: 0, page: 1, pageSize: 20 }, checkerUser());
    expect(fixture.nativeElement.textContent).not.toContain('New payment');
    expect(fixture.nativeElement.textContent).not.toContain('Upload bulk payments');
    expect(fixture.nativeElement.textContent).toContain('Review submitted payments');
  });

  it('hides mutating actions for an Auditor', async () => {
    await renderQueue({ items: [], total: 0, page: 1, pageSize: 20 }, auditorUser());
    expect(fixture.nativeElement.textContent).not.toContain('New payment');
    expect(fixture.nativeElement.textContent).not.toContain('Upload bulk payments');
    expect(fixture.nativeElement.textContent).toContain('View-only access');
    expect(fixture.nativeElement.textContent).not.toContain('Approve');
    expect(fixture.nativeElement.textContent).not.toContain('Return');
    expect(fixture.nativeElement.textContent).not.toContain('Reject');
    expect(fixture.nativeElement.textContent).not.toContain('Submit');
    expect(fixture.nativeElement.textContent).not.toContain('Cancel');
  });

  it('hides Maker actions when GET /api/me fails', async () => {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    http
      .expectOne((req) => req.url === `${environment.baseUrl}/me`)
      .flush(
        { code: 'UNEXPECTED_ERROR', message: 'Unavailable' },
        { status: 500, statusText: 'Server Error' },
      );
    flushReference();
    expectOnePayments().flush({ items: [], total: 0, page: 1, pageSize: 20 });
    await settle();

    expect(fixture.nativeElement.textContent).toContain('No payments found');
    expect(fixture.nativeElement.textContent).not.toContain('New payment');
    expect(fixture.nativeElement.textContent).not.toContain('Upload bulk payments');
  });

  it('shows an error state and retries GET /api/payments', async () => {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    flushSession(makerUser());
    flushReference();
    expectOnePayments().flush(
      { code: 'UNEXPECTED_ERROR', message: 'Unavailable' },
      { status: 500, statusText: 'Server Error' },
    );
    await settle();

    expect(fixture.nativeElement.textContent).toContain('Something went wrong');
    const retry = [...fixture.nativeElement.querySelectorAll('button')].find((button) =>
      (button.textContent ?? '').includes('Retry'),
    );
    expect(retry).toBeTruthy();
    retry?.click();
    TestBed.inject(ApplicationRef).tick();

    expectOnePayments().flush({ items: [], total: 0, page: 1, pageSize: 20 });
    await settle();
    expect(fixture.nativeElement.textContent).toContain('No payments found');
  });

  it('navigates to /payments/:id when a row is opened', async () => {
    await renderQueue({
      items: [summary('pay-9')],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.openPayment('pay-9');
    expect(navigate).toHaveBeenCalledWith(['/payments', 'pay-9']);
  });

  async function renderQueue(
    body: {
      items: PaymentSummary[];
      total: number;
      page: number;
      pageSize: number;
    },
    user: CurrentUser = makerUser(),
  ): Promise<TestRequest> {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    flushSession(user);
    flushReference();
    const listReq = expectOnePayments();
    listReq.flush(body);
    await settle();
    return listReq;
  }

  function flushSession(user: CurrentUser): void {
    http.expectOne((req) => req.url === `${environment.baseUrl}/me`).flush(user);
  }

  function flushReference(): void {
    http.expectOne(`${environment.baseUrl}/reference-data`).flush({
      currencies: [],
      paymentTypes: [{ value: PaymentType.Domestic, label: 'Domestic' }],
      paymentStatuses: [{ value: PaymentStatus.Draft, label: 'Draft' }],
      purposeCodes: [],
      chargeOptions: [],
    });
  }

  function expectOnePayments(): TestRequest {
    return http.expectOne((req) => req.url === `${environment.baseUrl}/payments`);
  }

  async function settle(): Promise<void> {
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});

function summary(id: string): PaymentSummary {
  return {
    id,
    reference: `REF-${id}`,
    type: { value: PaymentType.Domestic, label: 'Domestic' },
    status: { value: PaymentStatus.Draft, label: 'Draft' },
    debtorAccountMasked: '**** 4412',
    beneficiaryName: 'Acme Supplies',
    currency: 'GBP',
    amount: 100,
    makerUserId: 'usr-maker-1',
    makerName: 'Sara Malik',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    rowVersion: 1,
  };
}

function makerUser(): CurrentUser {
  return {
    userId: 'usr-maker-1',
    displayName: 'Sara Malik',
    role: { value: UserRole.Maker, label: 'Maker' },
    branchCode: 'LON1',
    entitlements: [],
  };
}

function checkerUser(): CurrentUser {
  return {
    userId: 'usr-checker-1',
    displayName: 'Nora Blake',
    role: { value: UserRole.Checker, label: 'Checker' },
    branchCode: 'LON1',
    entitlements: [Entitlement.ViewFullAccount],
  };
}

function auditorUser(): CurrentUser {
  return {
    userId: 'usr-auditor-1',
    displayName: 'Omar Said',
    role: { value: UserRole.Auditor, label: 'Auditor' },
    branchCode: 'LON1',
    entitlements: [],
  };
}
