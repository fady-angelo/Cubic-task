import { FormBuilder } from '@angular/forms';
import { PaymentType } from '../../shared/enums/payment.enums';
import { PaymentForm } from '../models/payment-form.models';
import { toPaymentWriteRequest } from './to-payment-write-request';

describe('toPaymentWriteRequest', () => {
  it('omits international fields from a domestic payload', () => {
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
        swift: 'NDEANOKK',
        country: 'NO',
        address: 'Oslo',
        bankCode: '040004',
      },
      payment: {
        amount: 10.12,
        currency: 'GBP',
        purposeCode: 'SUPP',
        remittanceInformation: 'Invoice 12',
        chargeOption: 'SHA',
      },
    });

    const payload = toPaymentWriteRequest(form, 'req-1');

    expect(payload).toEqual({
      clientRequestId: 'req-1',
      type: PaymentType.Domestic,
      debtorAccountId: 'acc-4412',
      beneficiary: {
        name: 'Acme Supplies Ltd',
        account: 'GB12ACME000004412',
        bankCode: '040004',
      },
      currency: 'GBP',
      amount: 10.12,
      executionDate: '2026-12-01',
      purposeCode: 'SUPP',
      remittanceInformation: 'Invoice 12',
    });
    expect(payload.beneficiary.swift).toBeUndefined();
    expect(payload.chargeOption).toBeUndefined();
  });

  it('omits domestic bank code from an international payload', () => {
    const form = createForm();
    form.patchValue({
      source: {
        debitAccountId: 'acc-4412',
        type: PaymentType.International,
        executionDate: '2026-12-01',
      },
      beneficiary: {
        name: 'Nordic Partner',
        account: 'NO9386011117947',
        bankCode: '040004',
        swift: 'NDEANOKK',
        country: 'NO',
        address: 'Oslo Harbour 12',
      },
      payment: {
        amount: 20,
        currency: 'EUR',
        chargeOption: 'SHA',
        purposeCode: 'TRAD',
        remittanceInformation: 'Goods',
      },
    });

    const payload = toPaymentWriteRequest(form, 'req-2', { fxQuoteId: 'fx-1' });

    expect(payload.beneficiary.bankCode).toBeUndefined();
    expect(payload.beneficiary.swift).toBe('NDEANOKK');
    expect(payload.chargeOption).toBe('SHA');
    expect(payload.fxQuoteId).toBe('fx-1');
    expect(payload.purposeCode).toBe('TRAD');
    expect(payload.remittanceInformation).toBe('Goods');
  });

  it('throws when purpose or remittance is missing', () => {
    const form = createForm();
    form.patchValue({
      source: {
        debitAccountId: 'acc-4412',
        type: PaymentType.Domestic,
        executionDate: '2026-12-01',
      },
      payment: { amount: 10.12, currency: 'GBP' },
    });

    expect(() => toPaymentWriteRequest(form, 'req-3')).toThrow('Purpose code is required.');
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
      currency: formBuilder.nonNullable.control(''),
      purposeCode: formBuilder.nonNullable.control(''),
      remittanceInformation: formBuilder.nonNullable.control(''),
      chargeOption: formBuilder.nonNullable.control(''),
    }),
  });
}
