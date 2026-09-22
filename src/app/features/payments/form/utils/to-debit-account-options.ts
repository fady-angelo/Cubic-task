import { Account, AccountSelectOption } from '../../models/account.models';

export function toDebitAccountOptions(
  accounts: Account[] | undefined,
  canViewFull: boolean,
): AccountSelectOption[] {
  return (accounts ?? []).map((account) => ({
    id: account.id,
    label: accountSelectLabel(account, canViewFull),
  }));
}

function accountSelectLabel(account: Account, canViewFull: boolean): string {
  const number = canViewFull ? account.iban : account.masked;
  return `${number} · ${account.currency}`;
}
