import { PaymentStatus, PaymentType } from '../../shared/enums/payment.enums';
import { PaymentDetail } from '../../models/payment-detail.models';
import { toPaymentFormValue } from './to-payment-form-value';

describe('toPaymentFormValue', () => {
  it('maps a domestic payment including beneficiary and payment fields', () => {
    const value = toPaymentFormValue(domesticDetail());

    expect(value.source).toEqual({
      debitAccountId: 'acc-4412',
      type: PaymentType.Domestic,
      executionDate: '2026-12-01',
    });
    expect(value.beneficiary).toEqual({
      mode: 'existing',
      existingId: 'ben-001',
      name: 'Elm Street Printers',
      account: 'GB12ACME000004412',
      bankCode: 'NWBK',
      swift: '',
      country: '',
      address: '',
    });
    expect(value.payment).toEqual({
      amount: 430.12,
      currency: 'GBP',
      purposeCode: 'SUPP',
      remittanceInformation: 'Invoice 61',
      chargeOption: '',
    });
  });

  it('uses new beneficiary mode when the payment has no beneficiary id', () => {
    const value = toPaymentFormValue({
      ...domesticDetail(),
      beneficiary: {
        name: 'Walk-in Ltd',
        account: 'GB00NEW0001',
        swift: 'NDEANOKK',
        country: 'NO',
        address: 'Oslo 1',
      },
      type: { value: PaymentType.International, label: 'International' },
      chargeOption: 'SHA',
      fxQuoteId: 'fx-1',
    });

    expect(value.beneficiary.mode).toBe('new');
    expect(value.beneficiary.existingId).toBe('');
    expect(value.beneficiary.swift).toBe('NDEANOKK');
    expect(value.payment.chargeOption).toBe('SHA');
  });
});

function domesticDetail(): PaymentDetail {
  return {
    id: 'pay-021',
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
