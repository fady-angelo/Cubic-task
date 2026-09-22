import { AccountSelectOption } from '../../models/account.models';
import { PaymentType } from '../../shared/enums/payment.enums';
import { FormBuilder, Validators } from '@angular/forms';
import { PaymentForm } from '../models/payment-form.models';
import { toPaymentReviewSummary } from './to-payment-review-summary';

describe('toPaymentReviewSummary', () => {
  it('maps form values and option labels into the review summary', () => {
    const form = createForm();
    form.patchValue({
      source: {
        debitAccountId: 'acc-4412',
        type: PaymentType.Domestic,
        executionDate: '2026-12-01',
      },
      beneficiary: { name: 'Acme Supplies Ltd' },
      payment: { amount: 10.12, currency: 'GBP' },
    });
    const accounts: AccountSelectOption[] = [
      { id: 'acc-4412', label: '**** **** **** 4412 · GBP' },
    ];

    const summary = toPaymentReviewSummary(form, accounts, [
      { value: PaymentType.Domestic, label: 'Domestic' },
    ]);

    expect(summary).toEqual({
      debitAccount: '**** **** **** 4412 · GBP',
      beneficiary: 'Acme Supplies Ltd',
      amount: 'GBP 10.12',
      type: 'Domestic',
      executionDate: '2026-12-01',
    });
  });
});

function createForm(): PaymentForm {
  const formBuilder = new FormBuilder();
  return formBuilder.nonNullable.group({
    source: formBuilder.nonNullable.group({
      debitAccountId: [''],
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
      currency: formBuilder.nonNullable.control('', { validators: [Validators.required] }),
      purposeCode: formBuilder.nonNullable.control(''),
      remittanceInformation: formBuilder.nonNullable.control(''),
      chargeOption: formBuilder.nonNullable.control(''),
    }),
  });
}
