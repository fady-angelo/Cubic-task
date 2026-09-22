import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { PaymentDetailActionsComponent } from '../../components/payment-detail-actions/payment-detail-actions.component';
import { errorInterceptor } from '../../../../../core/interceptors/error.interceptor';
import { Entitlement } from '../../../../../core/session/enums/entitlement';
import { UserRole } from '../../../../../core/session/enums/user-role';
import { CurrentUser } from '../../../../../core/session/models/current-user';
import { PaymentStatus, PaymentType } from '../../../shared/enums/payment.enums';
import { PaymentDetail } from '../../../models/payment-detail.models';
import { PaymentDetailComponent } from './payment-detail.component';

@Component({
  selector: 'app-payment-detail-host',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class PaymentDetailHost {}

describe('PaymentDetailComponent', () => {
  let fixture: ComponentFixture<PaymentDetailHost>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentDetailHost],
      providers: [
        provideRouter([{ path: 'payments/:id', component: PaymentDetailComponent }]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(PaymentDetailHost);
  });

  afterEach(() => {
    http.verify();
  });

  it('shows summary, source, beneficiary, status, rowVersion, and audit', async () => {
    await renderDetail(draftPayment(), makerUser());
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('PAY-2026-00061');
    expect(text).toContain('Elm Street Printers');
    expect(text).toContain('Draft');
    expect(text).toContain('rowVersion 1');
    expect(text).toContain('CREATED');
    expect(text).toContain('Invoice PAY-2026-00061');
    expect(text).toContain('**** 4412');
    expect(text).not.toContain('GB00FULL4412');
  });

  it('shows the full debit account when the user has VIEW_FULL_ACCOUNT', async () => {
    await renderDetail(draftPayment(), checkerUser());
    expect(fixture.nativeElement.textContent).toContain('GB00FULL4412');
  });

  it('lets a maker submit a draft with the current rowVersion', async () => {
    await renderDetail(draftPayment(), makerUser());
    clickButton('Submit');
    const submit = http.expectOne(`${environment.baseUrl}/payments/pay-021/submit`);
    expect(submit.request.body.rowVersion).toBe(1);
    expect(submit.request.body.clientRequestId).toBeTruthy();
    submit.flush({
      id: 'pay-021',
      reference: 'PAY-2026-00061',
      status: 'PENDING_CHECK',
      makerUserId: 'usr-maker-1',
      rowVersion: 2,
    });
    await flushReloadedPayment({
      ...draftPayment(),
      status: { value: PaymentStatus.PendingCheck, label: 'Pending check' },
      rowVersion: 2,
    });
  });

  it('does not POST submit twice while the first request is in progress', async () => {
    await renderDetail(draftPayment(), makerUser());
    clickButton('Submit');
    clickButton('Submit');
    http.expectOne(`${environment.baseUrl}/payments/pay-021/submit`).flush({
      id: 'pay-021',
      reference: 'PAY-2026-00061',
      status: 'PENDING_CHECK',
      makerUserId: 'usr-maker-1',
      rowVersion: 2,
    });
    http.expectNone(`${environment.baseUrl}/payments/pay-021/submit`);
    await flushReloadedPayment({
      ...draftPayment(),
      status: { value: PaymentStatus.PendingCheck, label: 'Pending check' },
      rowVersion: 2,
    });
  });

  it('blocks self-approval and still allows return', async () => {
    await renderDetail(pendingPayment('usr-checker-1'), checkerUser());
    expect(fixture.nativeElement.textContent).toContain(
      'A Checker cannot approve a payment created by the same user.',
    );
    expect(button('Approve')?.hasAttribute('disabled')).toBe(true);
    expect(button('Return')).not.toBeNull();
    expect(button('Reject')).not.toBeNull();
  });

  it('approves only after confirm and sends rowVersion', async () => {
    await renderDetail(pendingPayment('usr-maker-2'), checkerUser());
    clickButton('Approve');
    http.expectNone(`${environment.baseUrl}/payments/pay-020/decision`);
    clickButton('Confirm approve');
    const req = http.expectOne(`${environment.baseUrl}/payments/pay-020/decision`);
    expect(req.request.body.decision).toBe('APPROVE');
    expect(req.request.body.rowVersion).toBe(2);
    req.flush({
      id: 'pay-020',
      reference: 'PAY-2026-00060',
      status: 'APPROVED',
      makerUserId: 'usr-maker-2',
      rowVersion: 3,
    });
    await flushReloadedPayment({
      ...pendingPayment('usr-maker-2'),
      status: { value: PaymentStatus.Approved, label: 'Approved' },
      rowVersion: 3,
    });
  });

  it('requires a reason to return and reloads on HTTP 409', async () => {
    await renderDetail(pendingPayment('usr-maker-2'), checkerUser());
    clickButton('Return');
    clickButton('Confirm return');
    expect(fixture.nativeElement.textContent).toContain('A reason is required.');
    http.expectNone(`${environment.baseUrl}/payments/pay-020/decision`);

    const actions = fixture.debugElement.query(By.directive(PaymentDetailActionsComponent))
      .componentInstance as PaymentDetailActionsComponent;
    actions.reasonForm.controls.reason.setValue('Need invoice');
    fixture.detectChanges();
    clickButton('Confirm return');
    const req = http.expectOne(`${environment.baseUrl}/payments/pay-020/decision`);
    expect(req.request.body.reason).toBe('Need invoice');
    req.flush(
      { code: 'STALE_VERSION', message: 'Payment was updated by another request' },
      { status: 409, statusText: 'Conflict' },
    );
    await flushReloadedPayment({
      ...pendingPayment('usr-maker-2'),
      rowVersion: 9,
    });
    expect(fixture.nativeElement.textContent).toContain('updated elsewhere');
    expect(fixture.nativeElement.textContent).toContain('rowVersion 9');
  });

  it('hides maker and checker actions for an auditor', async () => {
    await renderDetail(pendingPayment('usr-maker-2'), auditorUser());
    expect(button('Approve')).toBeNull();
    expect(button('Submit')).toBeNull();
  });

  async function renderDetail(payment: PaymentDetail, user: CurrentUser): Promise<void> {
    await router.navigateByUrl(`/payments/${payment.id}`);
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    http.expectOne((req) => req.url === `${environment.baseUrl}/me`).flush(user);
    http.expectOne(`${environment.baseUrl}/payments/${payment.id}`).flush(payment);
    await settle();
  }

  async function flushReloadedPayment(payment: PaymentDetail): Promise<void> {
    TestBed.inject(ApplicationRef).tick();
    http.expectOne(`${environment.baseUrl}/payments/${payment.id}`).flush(payment);
    await settle();
  }

  async function settle(): Promise<void> {
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function clickButton(label: string): void {
    const found = button(label);
    expect(found).not.toBeNull();
    found?.click();
    fixture.detectChanges();
  }

  function button(label: string): HTMLButtonElement | HTMLAnchorElement | null {
    const nodes = Array.from(fixture.nativeElement.querySelectorAll('button, a')) as (
      HTMLButtonElement | HTMLAnchorElement
    )[];
    return nodes.find((node) => node.textContent?.trim() === label) ?? null;
  }
});

function draftPayment(): PaymentDetail {
  return {
    id: 'pay-021',
    reference: 'PAY-2026-00061',
    type: { value: PaymentType.Domestic, label: 'Domestic' },
    status: { value: PaymentStatus.Draft, label: 'Draft' },
    makerUserId: 'usr-maker-1',
    makerName: 'Sara Malik',
    debtorAccount: { id: 'acc-4412', masked: '**** 4412', full: 'GB00FULL4412', currency: 'GBP' },
    beneficiary: { name: 'Elm Street Printers', account: '**** 0061' },
    currency: 'GBP',
    amount: 430.12,
    executionDate: '2026-09-19',
    purposeCode: 'SUPP',
    remittanceInformation: 'Invoice PAY-2026-00061',
    rowVersion: 1,
    audit: [
      {
        event: 'CREATED',
        actorId: 'usr-maker-1',
        actorName: 'Sara Malik',
        at: '2026-09-19T18:10:00.000Z',
      },
    ],
  };
}

function pendingPayment(makerUserId: string): PaymentDetail {
  return {
    ...draftPayment(),
    id: 'pay-020',
    reference: 'PAY-2026-00060',
    status: { value: PaymentStatus.PendingCheck, label: 'Pending check' },
    makerUserId,
    rowVersion: 2,
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
