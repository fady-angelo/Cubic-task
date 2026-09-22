import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PaymentType } from '../../../shared/enums/payment.enums';
import { PaymentDetailsFormGroup } from '../../models/payment-form.models';
import { positiveAmountValidator } from '../../validators/positive-amount.validator';
import { currencyPrecisionValidator } from '../../validators/currency-precision.validator';
import {
  PaymentCurrencyOption,
  PaymentPaymentStepComponent,
} from './payment-payment-step.component';

@Component({
  selector: 'app-payment-payment-step-host',
  imports: [PaymentPaymentStepComponent],
  template: `
    <app-payment-payment-step
      [paymentForm]="paymentForm"
      [currencies]="currencies()"
      [purposeCodes]="purposeCodes()"
      [chargeOptions]="chargeOptions()"
      [paymentType]="paymentType()"
    />
  `,
})
class PaymentPaymentStepHost {
  readonly paymentType = signal<PaymentType | ''>(PaymentType.Domestic);
  readonly currencies = signal<PaymentCurrencyOption[]>([
    { code: 'GBP', minorUnits: 2 },
    { code: 'JPY', minorUnits: 0 },
  ]);
  readonly purposeCodes = signal(['SUPP', 'SALA']);
  readonly chargeOptions = signal(['SHA', 'OUR', 'BEN']);
  readonly paymentForm = createPaymentDetailsForm(() => this.minorUnits());

  private minorUnits(): number | undefined {
    const code = this.paymentForm.controls.currency.value;
    return this.currencies().find((currency) => currency.code === code)?.minorUnits;
  }
}

function createPaymentDetailsForm(
  getMinorUnits: () => number | undefined,
): PaymentDetailsFormGroup {
  const group: PaymentDetailsFormGroup = new FormGroup({
    amount: new FormControl<number | null>(null),
    currency: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    purposeCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    remittanceInformation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    chargeOption: new FormControl('', { nonNullable: true }),
  });
  group.controls.amount.setValidators([
    Validators.required,
    positiveAmountValidator,
    currencyPrecisionValidator(getMinorUnits),
  ]);
  return group;
}

describe('PaymentPaymentStepComponent', () => {
  let fixture: ComponentFixture<PaymentPaymentStepHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentPaymentStepHost],
    }).compileComponents();
    fixture = TestBed.createComponent(PaymentPaymentStepHost);
    fixture.detectChanges();
  });

  it('lists currencies from reference data', () => {
    const select = fixture.nativeElement.querySelector('#payment-currency') as HTMLSelectElement;
    expect(select.textContent).toContain('GBP');
    expect(select.textContent).toContain('JPY');
  });

  it('rejects zero and negative amounts', () => {
    const amount = fixture.componentInstance.paymentForm.controls.amount;
    amount.setValue(0);
    expect(amount.hasError('notPositive')).toBe(true);
    amount.setValue(-5);
    expect(amount.hasError('notPositive')).toBe(true);
    amount.setValue(10);
    expect(amount.valid).toBe(true);
  });

  it('rejects extra decimals for the selected currency', () => {
    const form = fixture.componentInstance.paymentForm.controls;
    form.currency.setValue('GBP');
    form.amount.setValue(10.123);
    expect(form.amount.hasError('currencyPrecision')).toBe(true);

    form.amount.setValue(10.12);
    expect(form.amount.hasError('currencyPrecision')).toBe(false);

    form.currency.setValue('JPY');
    form.amount.updateValueAndValidity();
    form.amount.setValue(10.5);
    expect(form.amount.hasError('currencyPrecision')).toBe(true);
  });

  it('requires purpose and remittance and renders remittance as text', () => {
    const purpose = fixture.nativeElement.querySelector('#payment-purpose') as HTMLSelectElement;
    expect(purpose.textContent).toContain('SUPP');
    expect(fixture.componentInstance.paymentForm.controls.purposeCode.invalid).toBe(true);
    expect(fixture.componentInstance.paymentForm.controls.remittanceInformation.invalid).toBe(true);
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

    const remittance = fixture.componentInstance.paymentForm.controls.remittanceInformation;
    remittance.setValue('<b>invoice 12</b>');
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector(
      '#payment-remittance',
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe('<b>invoice 12</b>');
  });

  it('shows charge option only for international payments', () => {
    expect(fixture.nativeElement.querySelector('#payment-charge')).toBeNull();

    fixture.componentInstance.paymentType.set(PaymentType.International);
    fixture.detectChanges();

    const charge = fixture.nativeElement.querySelector('#payment-charge') as HTMLSelectElement;
    expect(charge.textContent).toContain('SHA');
  });
});
