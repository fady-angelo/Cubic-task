import { LabelValue } from '../../../../shared/models/label-value';
import { AccountSelectOption } from '../../models/account.models';
import { PaymentForm, PaymentReviewSummary } from '../models/payment-form.models';

export function toPaymentReviewSummary(
  form: PaymentForm,
  debitAccounts: AccountSelectOption[],
  paymentTypes: LabelValue[] | undefined,
): PaymentReviewSummary {
  const raw = form.getRawValue();
  const account = debitAccounts.find((option) => option.id === raw.source.debitAccountId);
  const type = paymentTypes?.find((option) => option.value === raw.source.type);
  const amount = raw.payment.amount;
  const currency = raw.payment.currency;
  return {
    debitAccount: account?.label ?? '',
    beneficiary: raw.beneficiary.name,
    amount: amount == null || !currency ? '' : `${currency} ${amount}`,
    type: type?.label ?? '',
    executionDate: raw.source.executionDate,
  };
}
