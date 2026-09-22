import { PaymentWriteBeneficiary, PaymentWriteRequest } from '../../models/payment-command.models';
import { PaymentType } from '../../shared/enums/payment.enums';
import { PaymentForm } from '../models/payment-form.models';

type BeneficiaryFormValue = ReturnType<PaymentForm['getRawValue']>['beneficiary'];

export interface PaymentWriteExtras {
  rowVersion?: number;
  fxQuoteId?: string;
}

export function toPaymentWriteRequest(
  form: PaymentForm,
  clientRequestId: string,
  extras: PaymentWriteExtras = {},
): PaymentWriteRequest {
  const { source, beneficiary, payment } = form.getRawValue();
  const type = requiredPaymentType(source.type);

  const request: PaymentWriteRequest = {
    clientRequestId,
    type,
    debtorAccountId: source.debitAccountId,
    beneficiary: toWriteBeneficiary(beneficiary, type),
    currency: payment.currency,
    amount: requiredAmount(payment.amount),
    executionDate: source.executionDate,
    purposeCode: requiredText(payment.purposeCode, 'Purpose code'),
    remittanceInformation: requiredText(payment.remittanceInformation, 'Remittance information'),
  };

  if (type === PaymentType.International && payment.chargeOption) {
    request.chargeOption = payment.chargeOption;
  }
  if (extras.fxQuoteId) {
    request.fxQuoteId = extras.fxQuoteId;
  }
  if (extras.rowVersion != null) {
    request.rowVersion = extras.rowVersion;
  }

  return request;
}

function toWriteBeneficiary(
  beneficiary: BeneficiaryFormValue,
  type: PaymentType,
): PaymentWriteBeneficiary {
  const body: PaymentWriteBeneficiary = {
    name: beneficiary.name,
    account: beneficiary.account,
  };

  if (beneficiary.mode === 'existing' && beneficiary.existingId) {
    body.id = beneficiary.existingId;
  }

  if (type === PaymentType.Domestic) {
    if (beneficiary.bankCode) {
      body.bankCode = beneficiary.bankCode;
    }
    return body;
  }

  if (beneficiary.swift) {
    body.swift = beneficiary.swift;
  }
  if (beneficiary.country) {
    body.country = beneficiary.country;
  }
  if (beneficiary.address) {
    body.address = beneficiary.address;
  }
  return body;
}

function requiredPaymentType(type: PaymentType | ''): PaymentType {
  if (type !== PaymentType.Domestic && type !== PaymentType.International) {
    throw new Error('Payment type is required.');
  }
  return type;
}

function requiredAmount(amount: number | null): number {
  if (amount == null) {
    throw new Error('Amount is required.');
  }
  return amount;
}

function requiredText(value: string, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName} is required.`);
  }
  return value;
}
