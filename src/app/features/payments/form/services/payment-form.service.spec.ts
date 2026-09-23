import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PaymentStatus, PaymentType } from '../../shared/enums/payment.enums';
import { PaymentFormService } from './payment-form.service';

describe('PaymentFormService', () => {
  it('clears inapplicable fields when switching payment type', () => {
    TestBed.configureTestingModule({
      providers: [PaymentFormService],
    });
    const service = TestBed.inject(PaymentFormService);
    const form = service.createForm(() => 2, TestBed.inject(DestroyRef));

    form.controls.source.controls.type.setValue(PaymentType.International);
    form.controls.beneficiary.patchValue({
      swift: 'NDEANOKK',
      country: 'NO',
      address: 'Oslo Harbour 12',
    });
    form.controls.payment.controls.chargeOption.setValue('SHA');
    form.controls.source.controls.type.setValue(PaymentType.Domestic);

    const raw = form.getRawValue();
    expect(raw.beneficiary.swift).toBe('');
    expect(raw.beneficiary.country).toBe('');
    expect(raw.beneficiary.address).toBe('');
    expect(raw.payment.chargeOption).toBe('');
  });

  it('applies a payment detail onto every form group', () => {
    TestBed.configureTestingModule({
      providers: [PaymentFormService],
    });
    const service = TestBed.inject(PaymentFormService);
    const form = service.createForm(() => 2, TestBed.inject(DestroyRef));

    service.applyDetail(form, {
      id: 'pay-021',
      reference: 'PAY-2026-00061',
      type: { value: PaymentType.International, label: 'International' },
      status: { value: PaymentStatus.Draft, label: 'Draft' },
      makerUserId: 'usr-maker-1',
      makerName: 'Sara Malik',
      debtorAccount: { id: 'acc-4412', masked: '**** 4412' },
      beneficiary: {
        name: 'Nordic Payee',
        account: 'NO9386011117947',
        swift: 'NDEANOKK',
        country: 'NO',
        address: 'Oslo Harbour 12',
      },
      currency: 'EUR',
      amount: 100.5,
      executionDate: '2026-12-01',
      purposeCode: 'TRAD',
      remittanceInformation: 'Goods',
      chargeOption: 'SHA',
      fxQuoteId: 'fx-9',
      rowVersion: 2,
      audit: [],
    });

    const raw = form.getRawValue();
    expect(raw.source.type).toBe(PaymentType.International);
    expect(raw.beneficiary.name).toBe('Nordic Payee');
    expect(raw.beneficiary.swift).toBe('NDEANOKK');
    expect(raw.payment.amount).toBe(100.5);
    expect(raw.payment.currency).toBe('EUR');
    expect(raw.payment.purposeCode).toBe('TRAD');
    expect(raw.payment.remittanceInformation).toBe('Goods');
    expect(raw.payment.chargeOption).toBe('SHA');
    expect(form.dirty).toBe(false);
  });

  it('requires purpose code and remittance information', () => {
    TestBed.configureTestingModule({
      providers: [PaymentFormService],
    });
    const service = TestBed.inject(PaymentFormService);
    const form = service.createForm(() => 2, TestBed.inject(DestroyRef));
    const payment = form.controls.payment.controls;

    expect(payment.purposeCode.hasError('required')).toBe(true);
    expect(payment.remittanceInformation.hasError('required')).toBe(true);

    payment.purposeCode.setValue('SUPP');
    payment.remittanceInformation.setValue('Invoice 12');
    expect(payment.purposeCode.valid).toBe(true);
    expect(payment.remittanceInformation.valid).toBe(true);
  });

  it('applies beneficiary and charge rules from payment type without a step component', () => {
    TestBed.configureTestingModule({
      providers: [PaymentFormService],
    });
    const service = TestBed.inject(PaymentFormService);
    const form = service.createForm(() => 2, TestBed.inject(DestroyRef));
    const beneficiary = form.controls.beneficiary.controls;

    expect(beneficiary.name.hasError('required')).toBe(false);
    expect(beneficiary.account.hasError('required')).toBe(false);
    expect(beneficiary.swift.disabled).toBe(true);
    expect(beneficiary.bankCode.disabled).toBe(true);

    form.controls.source.controls.type.setValue(PaymentType.Domestic);
    expect(beneficiary.name.hasError('required')).toBe(true);
    expect(beneficiary.account.hasError('required')).toBe(true);
    expect(beneficiary.bankCode.enabled).toBe(true);
    expect(beneficiary.swift.disabled).toBe(true);
    expect(beneficiary.swift.hasError('required')).toBe(false);

    form.controls.source.controls.type.setValue(PaymentType.International);
    expect(beneficiary.bankCode.disabled).toBe(true);
    expect(beneficiary.swift.enabled).toBe(true);
    expect(beneficiary.swift.hasError('required')).toBe(true);
    expect(beneficiary.country.hasError('required')).toBe(true);
    expect(beneficiary.address.hasError('required')).toBe(true);
    expect(form.controls.payment.controls.chargeOption.enabled).toBe(true);
    expect(form.controls.payment.controls.chargeOption.hasError('required')).toBe(true);
  });

  it('revalidates amount precision when currency changes', () => {
    TestBed.configureTestingModule({
      providers: [PaymentFormService],
    });
    const service = TestBed.inject(PaymentFormService);
    const form = service.createForm((code) => (code === 'JPY' ? 0 : 2), TestBed.inject(DestroyRef));
    const amount = form.controls.payment.controls.amount;
    const currency = form.controls.payment.controls.currency;

    currency.setValue('GBP');
    amount.setValue(10.12);
    expect(amount.hasError('currencyPrecision')).toBe(false);

    currency.setValue('JPY');
    expect(amount.hasError('currencyPrecision')).toBe(true);
  });
});
