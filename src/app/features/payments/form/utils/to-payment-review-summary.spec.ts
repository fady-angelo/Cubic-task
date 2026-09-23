import { AccountSelectOption } from '../../models/account.models';
import { PaymentType } from '../../shared/enums/payment.enums';
import { FormBuilder, Validators } from '@angular/forms';
import { PaymentForm } from '../models/payment-form.models';
import { toPaymentReviewSummary } from './to-payment-review-summary';

describe('toPaymentReviewSummary', () => {
  it('maps a domestic payment with a masked debit and beneficiary account', () => {
    const form = createForm();
    form.patchValue({
      source: {
        debitAccountId: 'acc-4412',
        type: PaymentType.Domestic,
        executionDate: '2026-12-01',
      },
      beneficiary: {
        name: 'Acme Supplies Ltd',
        account: 'GB12ACME000004412',
        bankCode: 'NWBK',
      },
      payment: {
        amount: 10.12,
        currency: 'GBP',
        purposeCode: 'SUPP',
        remittanceInformation: 'Invoice 12',
      },
    });
    const accounts: AccountSelectOption[] = [
      { id: 'acc-4412', label: '**** **** **** 4412 · GBP' },
    ];

    const summary = toPaymentReviewSummary(
      form,
      accounts,
      [{ value: PaymentType.Domestic, label: 'Domestic' }],
      false,
    );

    expect(summary).toEqual({
      debitAccount: '**** **** **** 4412 · GBP',
      beneficiary: 'Acme Supplies Ltd',
      beneficiaryAccount: '**** 4412',
      amount: 'GBP 10.12',
      type: 'Domestic',
      executionDate: '2026-12-01',
      purposeCode: 'SUPP',
      remittanceInformation: 'Invoice 12',
      bankCode: 'NWBK',
      swift: '',
      country: '',
      address: '',
      chargeOption: '',
    });
  });

  it('includes international fields and the full beneficiary account when entitled', () => {
    const form = createForm();
    form.patchValue({
      source: {
        debitAccountId: 'acc-4412',
        type: PaymentType.International,
        executionDate: '2026-12-01',
      },
      beneficiary: {
        name: 'Nordic Freight',
        account: 'NO9386011117947',
        swift: 'NDEANOKK',
        country: 'NO',
        address: 'Oslo Harbour 12',
      },
      payment: {
        amount: 20,
        currency: 'EUR',
        purposeCode: 'TRAD',
        remittanceInformation: 'Shipment 9',
        chargeOption: 'SHA',
      },
    });

    const summary = toPaymentReviewSummary(
      form,
      [{ id: 'acc-4412', label: 'GB29CUBI0000000004412 · GBP' }],
      [{ value: PaymentType.International, label: 'International' }],
      true,
    );

    expect(summary.swift).toBe('NDEANOKK');
    expect(summary.country).toBe('NO');
    expect(summary.address).toBe('Oslo Harbour 12');
    expect(summary.chargeOption).toBe('SHA');
    expect(summary.bankCode).toBe('');
    expect(summary.beneficiaryAccount).toBe('NO9386011117947');
    expect(summary.purposeCode).toBe('TRAD');
    expect(summary.remittanceInformation).toBe('Shipment 9');
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
