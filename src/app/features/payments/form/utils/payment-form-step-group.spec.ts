import { FormBuilder, Validators } from '@angular/forms';
import { PaymentType } from '../../shared/enums/payment.enums';
import { PaymentForm } from '../models/payment-form.models';
import { isPaymentFormStepValid, paymentFormGroupForStep } from './payment-form-step-group';

describe('paymentFormGroupForStep', () => {
  it('returns the nested group for steps 1–3 and null on review', () => {
    const form = createForm();
    expect(paymentFormGroupForStep(form, 1)).toBe(form.controls.source);
    expect(paymentFormGroupForStep(form, 2)).toBe(form.controls.beneficiary);
    expect(paymentFormGroupForStep(form, 3)).toBe(form.controls.payment);
    expect(paymentFormGroupForStep(form, 4)).toBeNull();
  });

  it('treats an empty source group as invalid and review as valid', () => {
    const form = createForm();
    expect(isPaymentFormStepValid(form, 1)).toBe(false);
    form.controls.source.controls.debitAccountId.setValue('acc-1');
    expect(isPaymentFormStepValid(form, 1)).toBe(true);
    expect(isPaymentFormStepValid(form, 4)).toBe(true);
  });
});

function createForm(): PaymentForm {
  const formBuilder = new FormBuilder();
  return formBuilder.nonNullable.group({
    source: formBuilder.nonNullable.group({
      debitAccountId: ['', Validators.required],
      type: formBuilder.nonNullable.control<PaymentType | ''>(''),
      executionDate: [''],
    }),
    beneficiary: formBuilder.nonNullable.group({
      mode: formBuilder.nonNullable.control<'existing' | 'new'>('existing'),
      existingId: [''],
      name: [''],
      account: [''],
      bankCode: [''],
      swift: [''],
      country: [''],
      address: [''],
    }),
    payment: formBuilder.group({
      amount: formBuilder.control<number | null>(null),
      currency: formBuilder.nonNullable.control(''),
      purposeCode: formBuilder.nonNullable.control(''),
      remittanceInformation: formBuilder.nonNullable.control(''),
      chargeOption: formBuilder.nonNullable.control(''),
    }),
  });
}
