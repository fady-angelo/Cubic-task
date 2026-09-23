import { LabelValue } from '../../../../shared/models/label-value';
import { AccountSelectOption } from '../../models/account.models';
import { PaymentType } from '../../shared/enums/payment.enums';
import { PaymentForm, PaymentReviewSummary } from '../models/payment-form.models';

export function toPaymentReviewSummary(
  form: PaymentForm,
  debitAccounts: AccountSelectOption[],
  paymentTypes: LabelValue[] | undefined,
  canViewFullAccount: boolean,
): PaymentReviewSummary {
  const raw = form.getRawValue();
  const account = debitAccounts.find((option) => option.id === raw.source.debitAccountId);
  const type = paymentTypes?.find((option) => option.value === raw.source.type);
  const amount = raw.payment.amount;
  const currency = raw.payment.currency;
  const isInternational = raw.source.type === PaymentType.International;
  return {
    debitAccount: account?.label ?? '',
    beneficiary: raw.beneficiary.name,
    beneficiaryAccount: displayedBeneficiaryAccount(raw.beneficiary.account, canViewFullAccount),
    amount: amount == null || !currency ? '' : `${currency} ${amount}`,
    type: type?.label ?? '',
    executionDate: raw.source.executionDate,
    purposeCode: raw.payment.purposeCode,
    remittanceInformation: raw.payment.remittanceInformation,
    bankCode: raw.source.type === PaymentType.Domestic ? raw.beneficiary.bankCode : '',
    swift: isInternational ? raw.beneficiary.swift : '',
    country: isInternational ? raw.beneficiary.country : '',
    address: isInternational ? raw.beneficiary.address : '',
    chargeOption: isInternational ? raw.payment.chargeOption : '',
  };
}

function displayedBeneficiaryAccount(account: string, canViewFull: boolean): string {
  if (!account || canViewFull || account.length <= 4) {
    return account;
  }
  return `**** ${account.slice(-4)}`;
}
