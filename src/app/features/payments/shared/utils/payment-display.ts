import { PaymentAccountView } from '../../models/payment-detail.models';

export function displayedDebtorAccount(
  account: PaymentAccountView | null | undefined,
  canViewFull: boolean,
): string {
  if (!account) {
    return '';
  }
  if (canViewFull && account.full) {
    return account.full;
  }
  return account.masked;
}
