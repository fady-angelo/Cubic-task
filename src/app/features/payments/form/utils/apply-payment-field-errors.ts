import { AbstractControl } from '@angular/forms';
import { PaymentForm } from '../models/payment-form.models';

const FIELD_PATHS: Record<string, string> = {
  amount: 'payment.amount',
  currency: 'payment.currency',
  purposeCode: 'payment.purposeCode',
  remittanceInformation: 'payment.remittanceInformation',
  chargeOption: 'payment.chargeOption',
  debtorAccountId: 'source.debitAccountId',
  debitAccountId: 'source.debitAccountId',
  type: 'source.type',
  executionDate: 'source.executionDate',
  name: 'beneficiary.name',
  account: 'beneficiary.account',
  bankCode: 'beneficiary.bankCode',
  swift: 'beneficiary.swift',
  country: 'beneficiary.country',
  address: 'beneficiary.address',
  'beneficiary.name': 'beneficiary.name',
  'beneficiary.account': 'beneficiary.account',
  'beneficiary.bankCode': 'beneficiary.bankCode',
  'beneficiary.swift': 'beneficiary.swift',
  'beneficiary.country': 'beneficiary.country',
  'beneficiary.address': 'beneficiary.address',
};

export function applyPaymentFieldErrors(
  form: PaymentForm,
  fieldErrors: Record<string, string> | undefined,
): void {
  if (!fieldErrors) {
    return;
  }
  for (const [field, message] of Object.entries(fieldErrors)) {
    const control = controlFor(form, field);
    if (!control) {
      continue;
    }
    control.setErrors({ ...control.errors, server: message });
  }
}

function controlFor(form: PaymentForm, field: string): AbstractControl | null {
  const path = FIELD_PATHS[field] ?? field;
  return form.get(path);
}
