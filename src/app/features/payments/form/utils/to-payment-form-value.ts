import { PaymentDetail } from '../../models/payment-detail.models';
import { PaymentType } from '../../shared/enums/payment.enums';
import { toDateInputValue } from '../../../../shared/utils/date-input';
import { BeneficiaryMode } from '../models/payment-form.models';

export interface PaymentFormValue {
  source: {
    debitAccountId: string;
    type: PaymentType | '';
    executionDate: string;
  };
  beneficiary: {
    mode: BeneficiaryMode;
    existingId: string;
    name: string;
    account: string;
    bankCode: string;
    swift: string;
    country: string;
    address: string;
  };
  payment: {
    amount: number | null;
    currency: string;
    purposeCode: string;
    remittanceInformation: string;
    chargeOption: string;
  };
}

export function toPaymentFormValue(payment: PaymentDetail): PaymentFormValue {
  const type = payment.type.value;
  const existingId = payment.beneficiary.id ?? '';
  return {
    source: {
      debitAccountId: payment.debtorAccount.id,
      type,
      executionDate: toDateInputValue(payment.executionDate),
    },
    beneficiary: {
      mode: existingId ? 'existing' : 'new',
      existingId,
      name: payment.beneficiary.name ?? '',
      account: payment.beneficiary.account ?? '',
      bankCode: payment.beneficiary.bankCode ?? '',
      swift: payment.beneficiary.swift ?? '',
      country: payment.beneficiary.country ?? '',
      address: payment.beneficiary.address ?? '',
    },
    payment: {
      amount: payment.amount,
      currency: payment.currency ?? '',
      purposeCode: payment.purposeCode ?? '',
      remittanceInformation: payment.remittanceInformation ?? '',
      chargeOption: payment.chargeOption ?? '',
    },
  };
}
