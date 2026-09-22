import { FormBuilder, Validators } from '@angular/forms';
import { PaymentType } from '../../shared/enums/payment.enums';
import { PaymentForm } from '../models/payment-form.models';
import { applyPaymentFieldErrors } from './apply-payment-field-errors';

describe('applyPaymentFieldErrors', () => {
  it('maps 422 fieldErrors onto matching form controls', () => {
    const form = createForm();

    applyPaymentFieldErrors(form, {
      amount: 'Must be greater than 0',
      debtorAccountId: 'Unknown account',
    });

    expect(form.controls.payment.controls.amount.getError('server')).toBe('Must be greater than 0');
    expect(form.controls.source.controls.debitAccountId.getError('server')).toBe('Unknown account');
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
