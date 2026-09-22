import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { errorInterceptor } from '../../../../../core/interceptors/error.interceptor';
import { Entitlement } from '../../../../../core/session/enums/entitlement';
import { UserRole } from '../../../../../core/session/enums/user-role';
import { CurrentUser } from '../../../../../core/session/models/current-user';
import { PaymentStatus, PaymentType } from '../../../shared/enums/payment.enums';
import { Account } from '../../../models/account.models';
import { PaymentDetail } from '../../../models/payment-detail.models';
import { toDateInputValue, todayDateInputValue } from '../../../../../shared/utils/date-input';
import { PaymentFormComponent } from './payment-form.component';
import { UnsavedPaymentTracker } from '../../guards/unsaved-payment.guard';

describe('PaymentFormComponent', () => {
  let fixture: ComponentFixture<PaymentFormComponent>;
  let http: HttpTestingController;

  async function setup(
    id: string | null = null,
    user: CurrentUser = makerUser(),
    payment?: PaymentDetail,
  ): Promise<void> {
    const paramMap = convertToParamMap(id ? { id } : {});
    await TestBed.configureTestingModule({
      imports: [PaymentFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap },
            paramMap: of(paramMap),
          },
        },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PaymentFormComponent);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    flushSession(user);
    flushAccounts();
    flushReference();
    flushBeneficiaries();
    if (id) {
      flushPayment(payment ?? draftPayment(id));
    }
    await settle();
  }

  afterEach(() => {
    http.verify();
  });

  it('renders the create form on step 1 Source', async () => {
    await setup();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('New payment');
    expect(text).toContain('1. Source');
    expect(fixture.componentInstance.currentStep()).toBe(1);
    const current = fixture.nativeElement.querySelector('[aria-current="step"]') as HTMLElement;
    expect(current.textContent).toContain('1. Source');
  });

  it('has a typed nested form for all four steps', async () => {
    await setup();

    const { controls } = fixture.componentInstance.form;
    expect(controls.source.controls.debitAccountId.value).toBe('');
    expect(controls.beneficiary.controls.mode.value).toBe('existing');
    expect(controls.payment.controls.amount.value).toBeNull();
  });

  it('loads debit accounts into the select as masked numbers', async () => {
    await setup();

    const select = fixture.nativeElement.querySelector('#debit-account') as HTMLSelectElement;
    expect(select.textContent).toContain('**** **** **** 4412 · GBP');
    expect(select.textContent).not.toContain('GB29CUBI0000000004412');
  });

  it('shows the full debit account when the user has VIEW_FULL_ACCOUNT', async () => {
    await setup(null, checkerUser());

    const select = fixture.nativeElement.querySelector('#debit-account') as HTMLSelectElement;
    expect(select.textContent).toContain('GB29CUBI0000000004412 · GBP');
  });

  it('requires a debit account', async () => {
    await setup();

    const control = fixture.componentInstance.form.controls.source.controls.debitAccountId;
    expect(control.invalid).toBe(true);
    control.setValue('acc-4412');
    expect(control.valid).toBe(true);
  });

  it('requires a payment type from reference data', async () => {
    await setup();

    const select = fixture.nativeElement.querySelector('#payment-type') as HTMLSelectElement;
    expect(select.textContent).toContain('Domestic');
    expect(select.textContent).toContain('International');

    const control = fixture.componentInstance.form.controls.source.controls.type;
    expect(control.invalid).toBe(true);
    control.setValue(PaymentType.Domestic);
    expect(control.valid).toBe(true);
  });

  it('rejects an execution date in the past and accepts today', async () => {
    await setup();

    const control = fixture.componentInstance.form.controls.source.controls.executionDate;
    control.setValue(shiftDays(-1));
    expect(control.hasError('pastDate')).toBe(true);

    control.setValue(toDateInputValue(new Date()));
    expect(control.valid).toBe(true);
  });

  it('hydrates source, beneficiary, and payment fields when editing a draft', async () => {
    await setup('pay-021', makerUser(), draftPayment('pay-021'));

    const { source, beneficiary, payment } = fixture.componentInstance.form.controls;
    expect(source.controls.debitAccountId.value).toBe('acc-4412');
    expect(source.controls.type.value).toBe(PaymentType.Domestic);
    expect(source.controls.executionDate.value).toBe('2026-12-01');
    expect(beneficiary.controls.mode.value).toBe('existing');
    expect(beneficiary.controls.existingId.value).toBe('ben-001');
    expect(beneficiary.controls.name.value).toBe('Elm Street Printers');
    expect(beneficiary.controls.account.value).toBe('GB12ACME000004412');
    expect(beneficiary.controls.bankCode.value).toBe('NWBK');
    expect(payment.controls.amount.value).toBe(430.12);
    expect(payment.controls.currency.value).toBe('GBP');
    expect(payment.controls.purposeCode.value).toBe('SUPP');
    expect(payment.controls.remittanceInformation.value).toBe('Invoice 61');
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
  });

  it('saves an edited draft with hydrated beneficiary and payment fields', async () => {
    await setup('pay-021', makerUser(), draftPayment('pay-021'));
    openReview(fixture);
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    findButton(fixture, 'Save draft').click();
    const update = http.expectOne(`${environment.baseUrl}/payments/pay-021`);
    expect(update.request.body.amount).toBe(430.12);
    expect(update.request.body.currency).toBe('GBP');
    expect(update.request.body.purposeCode).toBe('SUPP');
    expect(update.request.body.remittanceInformation).toBe('Invoice 61');
    expect(update.request.body.beneficiary).toEqual({
      id: 'ben-001',
      name: 'Elm Street Printers',
      account: 'GB12ACME000004412',
      bankCode: 'NWBK',
    });
    update.flush(writeResult('pay-021', 2));
  });

  it('does not allow editing a payment that is not draft or returned', async () => {
    await setup('pay-020', makerUser(), pendingPayment('pay-020'));

    expect(fixture.nativeElement.textContent).toContain(
      'Only draft or returned payments can be edited.',
    );
    expect(fixture.componentInstance.form.controls.source.controls.debitAccountId.value).toBe('');
  });

  it('moves Next and Back without submitting', async () => {
    await setup();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const submit = vi.fn();
    form.addEventListener('submit', submit);

    fixture.componentInstance.goNext();
    fixture.detectChanges();
    expect(fixture.componentInstance.currentStep()).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('2. Beneficiary');

    fixture.componentInstance.goBack();
    fixture.detectChanges();
    expect(fixture.componentInstance.currentStep()).toBe(1);

    const nextButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Next',
    ) as HTMLButtonElement;
    expect(nextButton.type).toBe('button');
    expect(submit).not.toHaveBeenCalled();
  });

  it('fills name and account when an existing beneficiary is selected', async () => {
    await setup();
    fixture.componentInstance.goNext();
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '#existing-beneficiary',
    ) as HTMLSelectElement;
    select.value = 'ben-001';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const beneficiary = fixture.componentInstance.form.controls.beneficiary.controls;
    expect(beneficiary.name.value).toBe('Acme Supplies Ltd');
    expect(beneficiary.account.value).toBe('GB12ACME000004412');
  });

  it('requires domestic beneficiary name and account and does not require SWIFT', async () => {
    await setup();
    fixture.componentInstance.form.controls.source.controls.type.setValue(PaymentType.Domestic);
    fixture.componentInstance.goNext();
    fixture.detectChanges();

    const beneficiary = fixture.componentInstance.form.controls.beneficiary.controls;
    expect(beneficiary.name.invalid).toBe(true);
    expect(beneficiary.account.invalid).toBe(true);
    expect(beneficiary.swift.disabled).toBe(true);
    expect(beneficiary.swift.hasError('required')).toBe(false);
    expect(fixture.nativeElement.querySelector('#beneficiary-swift')).toBeNull();

    beneficiary.name.setValue('Acme Supplies Ltd');
    beneficiary.account.setValue('GB12ACME000004412');
    expect(beneficiary.name.valid).toBe(true);
    expect(beneficiary.account.valid).toBe(true);
  });

  it('requires SWIFT, country, and address for an international payment', async () => {
    await setup();
    fixture.componentInstance.form.controls.source.controls.type.setValue(
      PaymentType.International,
    );
    fixture.componentInstance.goNext();
    fixture.detectChanges();

    const beneficiary = fixture.componentInstance.form.controls.beneficiary.controls;
    expect(beneficiary.swift.invalid).toBe(true);
    expect(beneficiary.country.invalid).toBe(true);
    expect(beneficiary.address.invalid).toBe(true);
    expect(fixture.nativeElement.querySelector('#beneficiary-swift')).toBeTruthy();

    beneficiary.swift.setValue('NDEANOKK');
    beneficiary.country.setValue('NO');
    beneficiary.address.setValue('Oslo Harbour 12');
    expect(beneficiary.swift.valid).toBe(true);
    expect(beneficiary.country.valid).toBe(true);
    expect(beneficiary.address.valid).toBe(true);
  });

  it('clears SWIFT, country, address, and charge when switching back to Domestic', async () => {
    await setup();
    const form = fixture.componentInstance.form;
    form.controls.source.controls.type.setValue(PaymentType.International);
    fixture.componentInstance.goNext();
    fixture.detectChanges();

    form.controls.beneficiary.patchValue({
      swift: 'NDEANOKK',
      country: 'NO',
      address: 'Oslo Harbour 12',
    });
    form.controls.payment.controls.chargeOption.setValue('SHA');
    form.controls.source.controls.type.setValue(PaymentType.Domestic);
    fixture.detectChanges();

    const raw = form.getRawValue();
    expect(raw.beneficiary.swift).toBe('');
    expect(raw.beneficiary.country).toBe('');
    expect(raw.beneficiary.address).toBe('');
    expect(raw.payment.chargeOption).toBe('');
  });

  it('clears name and account when switching to a new beneficiary', async () => {
    await setup();
    fixture.componentInstance.goNext();
    fixture.detectChanges();

    const beneficiary = fixture.componentInstance.form.controls.beneficiary;
    beneficiary.patchValue({
      existingId: 'ben-001',
      name: 'Acme Supplies Ltd',
      account: 'GB12ACME000004412',
    });
    fixture.detectChanges();

    const newRadio = [...fixture.nativeElement.querySelectorAll('input[type="radio"]')].find(
      (input: HTMLInputElement) => input.value === 'new',
    ) as HTMLInputElement;
    newRadio.click();
    newRadio.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(beneficiary.controls.mode.value).toBe('new');
    expect(beneficiary.controls.existingId.value).toBe('');
    expect(beneficiary.controls.name.value).toBe('');
    expect(beneficiary.controls.account.value).toBe('');
  });

  it('requires a positive amount and a currency from reference data', async () => {
    await setup();
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#payment-currency') as HTMLSelectElement;
    expect(select.textContent).toContain('GBP');
    expect(select.textContent).toContain('JPY');

    const amount = fixture.componentInstance.form.controls.payment.controls.amount;
    const currency = fixture.componentInstance.form.controls.payment.controls.currency;
    expect(amount.invalid).toBe(true);
    expect(currency.invalid).toBe(true);

    amount.setValue(0);
    expect(amount.hasError('notPositive')).toBe(true);
    amount.setValue(-1);
    expect(amount.hasError('notPositive')).toBe(true);

    currency.setValue('GBP');
    amount.setValue(10.123);
    expect(amount.hasError('currencyPrecision')).toBe(true);
    amount.setValue(10.12);
    expect(amount.valid).toBe(true);
  });

  it('requires purpose and remittance, and charge only for International', async () => {
    await setup();
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    fixture.detectChanges();

    const payment = fixture.componentInstance.form.controls.payment.controls;
    expect(fixture.nativeElement.querySelector('#payment-purpose').textContent).toContain('SUPP');
    expect(payment.purposeCode.invalid).toBe(true);
    expect(payment.remittanceInformation.invalid).toBe(true);
    expect(
      fixture.nativeElement.querySelector('label[for="payment-purpose"]').classList.contains(
        'is-required',
      ),
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelector('label[for="payment-remittance"]').classList.contains(
        'is-required',
      ),
    ).toBe(true);
    expect(fixture.nativeElement.querySelector('#payment-charge')).toBeNull();
    expect(payment.chargeOption.disabled).toBe(true);

    fixture.componentInstance.form.controls.source.controls.type.setValue(
      PaymentType.International,
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#payment-charge')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#payment-charge').textContent).toContain('SHA');
    expect(payment.chargeOption.enabled).toBe(true);
    expect(payment.chargeOption.invalid).toBe(true);
    payment.chargeOption.setValue('SHA');
    expect(payment.chargeOption.valid).toBe(true);
  });

  it('shows a masked review summary and disables Submit until the form is valid', async () => {
    await setup();
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    fixture.detectChanges();

    const submit = findButton(fixture, 'Submit');
    expect(submit.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'Fix the required fields before confirming.',
    );

    fillValidDomestic(fixture.componentInstance);
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('**** **** **** 4412 · GBP');
    expect(fixture.nativeElement.textContent).toContain('Acme Supplies Ltd');
    expect(fixture.nativeElement.textContent).toContain('GBP 10.12');
    expect(fixture.nativeElement.textContent).not.toContain('GB29CUBI0000000004412');
    expect(submit.disabled).toBe(false);
  });

  it('requests an FX quote on the payment step when currencies differ', async () => {
    await setup();
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    fixture.detectChanges();
    expect(fixture.componentInstance.currentStep()).toBe(3);

    fillValidDomestic(fixture.componentInstance);
    fixture.componentInstance.form.controls.payment.controls.currency.setValue('EUR');
    TestBed.inject(ApplicationRef).tick();

    const quote = http.expectOne(`${environment.baseUrl}/fx/quote`);
    expect(quote.request.body).toEqual({
      debitAccountId: 'acc-4412',
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      targetAmount: 10.12,
    });
    expect(fixture.componentInstance.currentStep()).toBe(3);
    quote.flush({
      quoteId: 'fx-step-3',
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      rate: 1.12,
      targetAmount: 10.12,
      debitAmount: 11.33,
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    });
  });

  it('requests a new FX quote when amount changes while the form stays valid', async () => {
    await setup();
    fillValidDomestic(fixture.componentInstance);
    fixture.componentInstance.form.controls.payment.controls.currency.setValue('EUR');
    TestBed.inject(ApplicationRef).tick();
    http.expectOne(`${environment.baseUrl}/fx/quote`).flush({
      quoteId: 'fx-10',
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      rate: 1.12,
      targetAmount: 10.12,
      debitAmount: 11.33,
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    });

    fixture.componentInstance.form.controls.payment.controls.amount.setValue(4);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne(`${environment.baseUrl}/fx/quote`).flush({
      quoteId: 'fx-4-again',
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      rate: 1.12,
      targetAmount: 4,
      debitAmount: 4.48,
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    });

    fixture.componentInstance.form.controls.payment.controls.amount.setValue(40);
    TestBed.inject(ApplicationRef).tick();
    const quote = http.expectOne(`${environment.baseUrl}/fx/quote`);
    expect(quote.request.body.targetAmount).toBe(40);
    quote.flush({
      quoteId: 'fx-40',
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      rate: 1.12,
      targetAmount: 40,
      debitAmount: 44.8,
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    });
    TestBed.inject(ApplicationRef).tick();
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('fx-40');
    expect(fixture.nativeElement.textContent).toContain('40');
    expect(fixture.nativeElement.textContent).not.toContain('4.48');
  });

  it('does not request an FX quote when debit and payment currencies match', async () => {
    await setup();
    fillValidDomestic(fixture.componentInstance);
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    http.expectNone(`${environment.baseUrl}/fx/quote`);
    expect(findButton(fixture, 'Submit').disabled).toBe(false);
  });

  it('blocks Confirm when a required FX quote has expired', async () => {
    await setup();
    fillValidDomestic(fixture.componentInstance);
    fixture.componentInstance.form.controls.payment.controls.currency.setValue('EUR');
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    http.expectOne(`${environment.baseUrl}/fx/quote`).flush({
      quoteId: 'fx-expired',
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      rate: 1.12,
      targetAmount: 10.12,
      debitAmount: 11.33,
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    });
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('This FX quote has expired.');
    const submit = findButton(fixture, 'Submit');
    expect(submit.disabled).toBe(true);

    const requestNew = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Request new quote',
    ) as HTMLButtonElement;
    requestNew.click();
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    http.expectOne(`${environment.baseUrl}/fx/quote`).flush({
      quoteId: 'fx-fresh',
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      rate: 1.12,
      targetAmount: 10.12,
      debitAmount: 11.33,
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    });
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('fx-fresh');
    expect(submit.disabled).toBe(false);
  });

  it('does not go past the last step or before the first', async () => {
    await setup();

    fixture.componentInstance.goBack();
    expect(fixture.componentInstance.currentStep()).toBe(1);

    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    fixture.componentInstance.goNext();
    expect(fixture.componentInstance.currentStep()).toBe(4);
    expect(fixture.componentInstance.canGoNext()).toBe(false);
  });

  it('renders Edit payment when the route has an id', async () => {
    await setup('pay-00001');
    expect(fixture.nativeElement.textContent).toContain('Edit payment');
  });

  it('saves a draft with POST /payments and does not submit', async () => {
    await setup();
    openReview(fixture);
    fillValidDomestic(fixture.componentInstance);
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    findButton(fixture, 'Save draft').click();
    const create = http.expectOne(`${environment.baseUrl}/payments`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body.type).toBe(PaymentType.Domestic);
    expect(create.request.body.beneficiary.swift).toBeUndefined();
    expect(create.request.body.chargeOption).toBeUndefined();
    expect(create.request.body.clientRequestId).toBeTruthy();
    const navigate = TestBed.inject(Router).navigate;
    create.flush(writeResult('pay-099', 1));
    http.expectNone(`${environment.baseUrl}/payments/pay-099/submit`);
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/payments']);
    expect(navigate).not.toHaveBeenCalledWith(['/payments', 'pay-099']);
  });

  it('submits by creating then posting /submit', async () => {
    await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    openReview(fixture);
    fillValidDomestic(fixture.componentInstance);
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    findButton(fixture, 'Submit').click();
    http.expectOne(`${environment.baseUrl}/payments`).flush(writeResult('pay-099', 1));
    const submit = http.expectOne(`${environment.baseUrl}/payments/pay-099/submit`);
    expect(submit.request.method).toBe('POST');
    expect(submit.request.body.rowVersion).toBe(1);
    expect(submit.request.body.clientRequestId).toBeTruthy();
    submit.flush(writeResult('pay-099', 2, 'PENDING_CHECK'));
    expect(navigate).toHaveBeenCalledWith(['/payments', 'pay-099']);
  });

  it('updates an existing draft with PUT on Save draft', async () => {
    await setup('pay-021');
    openReview(fixture);
    fillValidDomestic(fixture.componentInstance);
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    findButton(fixture, 'Save draft').click();
    const update = http.expectOne(`${environment.baseUrl}/payments/pay-021`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body.rowVersion).toBe(1);
    update.flush(writeResult('pay-021', 2));
    http.expectNone(`${environment.baseUrl}/payments/pay-021/submit`);
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/payments']);
  });

  it('ignores a second Submit click while the first is in flight', async () => {
    await setup();
    openReview(fixture);
    fillValidDomestic(fixture.componentInstance);
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    findButton(fixture, 'Submit').click();
    findButton(fixture, 'Submit').click();
    http.expectOne(`${environment.baseUrl}/payments`).flush(writeResult('pay-099', 1));
    http
      .expectOne(`${environment.baseUrl}/payments/pay-099/submit`)
      .flush(writeResult('pay-099', 2));
    http.expectNone(`${environment.baseUrl}/payments`);
  });

  it('maps 422 fieldErrors onto the amount control', async () => {
    await setup();
    openReview(fixture);
    fillValidDomestic(fixture.componentInstance);
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    findButton(fixture, 'Save draft').click();
    http.expectOne(`${environment.baseUrl}/payments`).flush(
      {
        code: 'VALIDATION_ERROR',
        message: 'Amount must be greater than zero',
        fieldErrors: { amount: 'Must be greater than 0' },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.payment.controls.amount.getError('server')).toBe(
      'Must be greater than 0',
    );
    expect(fixture.nativeElement.textContent).toContain('Amount must be greater than zero');
  });

  it('reloads the payment on 409 and does not retry the mutation', async () => {
    await setup('pay-021');
    openReview(fixture);
    fillValidDomestic(fixture.componentInstance);
    TestBed.inject(ApplicationRef).tick();
    fixture.detectChanges();

    findButton(fixture, 'Save draft').click();
    http.expectOne(`${environment.baseUrl}/payments/pay-021`).flush(
      {
        code: 'STALE_VERSION',
        message: 'Payment was updated by another request',
        currentRowVersion: 9,
      },
      { status: 409, statusText: 'Conflict' },
    );
    TestBed.inject(ApplicationRef).tick();
    http.expectOne(`${environment.baseUrl}/payments/pay-021`).flush({
      ...draftPayment('pay-021'),
      rowVersion: 9,
    });
    await settle();

    expect(fixture.nativeElement.textContent).toContain('updated elsewhere');
    expect(fixture.componentInstance.form.controls.payment.controls.amount.value).toBe(430.12);
    http.expectNone(`${environment.baseUrl}/payments/pay-021`);

    findButton(fixture, 'Save draft').click();
    const retry = http.expectOne(`${environment.baseUrl}/payments/pay-021`);
    expect(retry.request.body.rowVersion).toBe(9);
    retry.flush(writeResult('pay-021', 10));
  });

  it('treats a dirty form as unsaved changes until it is saved', async () => {
    await setup();
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
    fillValidDomestic(fixture.componentInstance);
    fixture.componentInstance.form.markAsDirty();
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
  });

  it('shows a leave confirmation dialog when the form is dirty', async () => {
    await setup();
    TestBed.inject(UnsavedPaymentTracker).promptToLeave();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Leave without saving?');
    expect(fixture.nativeElement.textContent).toContain('Stay on this page');
  });

  function flushSession(user: CurrentUser): void {
    http.expectOne((req) => req.url === `${environment.baseUrl}/me`).flush(user);
  }

  function flushAccounts(): void {
    http.expectOne(`${environment.baseUrl}/accounts`).flush({ items: [gbpAccount()] });
  }

  function flushReference(): void {
    http.expectOne(`${environment.baseUrl}/reference-data`).flush({
      currencies: [
        { code: 'GBP', minorUnits: 2 },
        { code: 'JPY', minorUnits: 0 },
      ],
      paymentTypes: [
        { value: PaymentType.Domestic, label: 'Domestic' },
        { value: PaymentType.International, label: 'International' },
      ],
      paymentStatuses: [],
      purposeCodes: ['SUPP', 'SALA', 'TRAD'],
      chargeOptions: ['SHA', 'OUR', 'BEN'],
    });
  }

  function flushBeneficiaries(): void {
    http.expectOne(`${environment.baseUrl}/beneficiaries`).flush({
      items: [
        {
          id: 'ben-001',
          name: 'Acme Supplies Ltd',
          account: 'GB12ACME000004412',
          type: PaymentType.Domestic,
        },
      ],
    });
  }

  function flushPayment(payment: PaymentDetail): void {
    http.expectOne(`${environment.baseUrl}/payments/${payment.id}`).flush(payment);
  }

  async function settle(): Promise<void> {
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});

function fillValidDomestic(component: PaymentFormComponent): void {
  component.form.controls.source.patchValue({
    debitAccountId: 'acc-4412',
    type: PaymentType.Domestic,
    executionDate: todayDateInputValue(),
  });
  component.form.controls.beneficiary.patchValue({
    name: 'Acme Supplies Ltd',
    account: 'GB12ACME000004412',
  });
  component.form.controls.payment.patchValue({
    amount: 10.12,
    currency: 'GBP',
    purposeCode: 'SUPP',
    remittanceInformation: 'Invoice 12',
  });
}

function openReview(fixture: ComponentFixture<PaymentFormComponent>): void {
  fixture.componentInstance.goNext();
  fixture.componentInstance.goNext();
  fixture.componentInstance.goNext();
  fixture.detectChanges();
}

function findButton(
  fixture: ComponentFixture<PaymentFormComponent>,
  label: string,
): HTMLButtonElement {
  return [...fixture.nativeElement.querySelectorAll('button')].find(
    (button: HTMLButtonElement) => button.textContent?.trim() === label,
  ) as HTMLButtonElement;
}

function writeResult(id: string, rowVersion: number, status = 'DRAFT') {
  return {
    id,
    reference: 'PAY-2026-00099',
    status,
    makerUserId: 'usr-maker-1',
    rowVersion,
  };
}

function gbpAccount(): Account {
  return {
    id: 'acc-4412',
    iban: 'GB29CUBI0000000004412',
    masked: '**** **** **** 4412',
    currency: 'GBP',
    availableBalance: 2_450_000,
    status: 'ACTIVE',
  };
}

function draftPayment(id: string): PaymentDetail {
  return {
    id,
    reference: 'PAY-2026-00061',
    type: { value: PaymentType.Domestic, label: 'Domestic' },
    status: { value: PaymentStatus.Draft, label: 'Draft' },
    makerUserId: 'usr-maker-1',
    makerName: 'Sara Malik',
    debtorAccount: { id: 'acc-4412', masked: '**** 4412' },
    beneficiary: {
      id: 'ben-001',
      name: 'Elm Street Printers',
      account: 'GB12ACME000004412',
      bankCode: 'NWBK',
    },
    currency: 'GBP',
    amount: 430.12,
    executionDate: '2026-12-01',
    purposeCode: 'SUPP',
    remittanceInformation: 'Invoice 61',
    rowVersion: 1,
    audit: [],
  };
}

function pendingPayment(id: string): PaymentDetail {
  return {
    ...draftPayment(id),
    status: { value: PaymentStatus.PendingCheck, label: 'Pending check' },
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

function shiftDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}
