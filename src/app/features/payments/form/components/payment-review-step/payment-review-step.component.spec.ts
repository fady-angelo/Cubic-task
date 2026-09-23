import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FxQuote } from '../../../models/fx-quote.models';
import { PaymentReviewSummary } from '../../models/payment-form.models';
import { PaymentReviewStepComponent } from './payment-review-step.component';

@Component({
  selector: 'app-payment-review-step-host',
  imports: [PaymentReviewStepComponent],
  template: `
    <app-payment-review-step
      [summary]="summary()"
      [formValid]="formValid()"
      [requiresFxQuote]="requiresFxQuote()"
      [quote]="quote()"
      [quoteExpired]="quoteExpired()"
      [remainingSeconds]="remainingSeconds()"
      (retryQuote)="retryQuoteCount.set(retryQuoteCount() + 1)"
    />
  `,
})
class PaymentReviewStepHost {
  readonly formValid = signal(false);
  readonly requiresFxQuote = signal(false);
  readonly quote = signal<FxQuote | null>(null);
  readonly quoteExpired = signal(false);
  readonly remainingSeconds = signal(0);
  readonly retryQuoteCount = signal(0);
  readonly summary = signal<PaymentReviewSummary>({
    debitAccount: '**** **** **** 4412 · GBP',
    beneficiary: 'Acme Supplies Ltd',
    beneficiaryAccount: '**** 4412',
    amount: 'GBP 10.12',
    type: 'Domestic',
    executionDate: '2026-09-25',
    purposeCode: 'SUPP',
    remittanceInformation: 'Invoice 12',
    bankCode: 'NWBK',
    swift: '',
    country: '',
    address: '',
    chargeOption: '',
  });
}

describe('PaymentReviewStepComponent', () => {
  let fixture: ComponentFixture<PaymentReviewStepHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentReviewStepHost],
    }).compileComponents();
    fixture = TestBed.createComponent(PaymentReviewStepHost);
    fixture.detectChanges();
  });

  it('shows a masked debit account in the summary', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('**** **** **** 4412 · GBP');
    expect(text).toContain('Acme Supplies Ltd');
    expect(text).toContain('**** 4412');
    expect(text).toContain('GBP 10.12');
    expect(text).toContain('Domestic');
    expect(text).toContain('2026-09-25');
    expect(text).toContain('SUPP');
    expect(text).toContain('Invoice 12');
    expect(text).toContain('NWBK');
    expect(text).not.toContain('GB29CUBI0000000004412');
  });

  it('explains when the form is not ready to confirm', () => {
    expect(fixture.nativeElement.textContent).toContain(
      'Fix the required fields before confirming.',
    );
    fixture.componentInstance.formValid.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ready to confirm.');
  });

  it('shows remaining time for a live FX quote and an expired warning', () => {
    fixture.componentInstance.formValid.set(true);
    fixture.componentInstance.requiresFxQuote.set(true);
    fixture.componentInstance.quote.set({
      quoteId: 'fx-1',
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      rate: 1.12,
      targetAmount: 10,
      debitAmount: 11.2,
      expiresAt: new Date(Date.now() + 20_000).toISOString(),
    });
    fixture.componentInstance.remainingSeconds.set(20);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('fx-1');
    expect(text).toContain('1.12');
    expect(text).toContain('11.2 GBP');
    expect(text).toContain('10 EUR');
    expect(text).toContain('20s');

    fixture.componentInstance.quoteExpired.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This FX quote has expired.');

    const requestNew = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Request new quote',
    ) as HTMLButtonElement;
    requestNew.click();
    expect(fixture.componentInstance.retryQuoteCount()).toBe(1);
  });
});
