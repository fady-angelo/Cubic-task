import { toDebitAccountOptions } from './to-debit-account-options';

describe('toDebitAccountOptions', () => {
  const account = {
    id: 'acc-4412',
    iban: 'GB29CUBI0000000004412',
    masked: '**** **** **** 4412',
    currency: 'GBP',
    availableBalance: 1,
    status: 'ACTIVE',
  };

  it('maps accounts to masked select options unless VIEW_FULL_ACCOUNT is granted', () => {
    expect(toDebitAccountOptions([account], false)).toEqual([
      { id: 'acc-4412', label: '**** **** **** 4412 · GBP' },
    ]);
    expect(toDebitAccountOptions([account], true)).toEqual([
      { id: 'acc-4412', label: 'GB29CUBI0000000004412 · GBP' },
    ]);
  });

  it('returns an empty list when accounts are missing', () => {
    expect(toDebitAccountOptions(undefined, false)).toEqual([]);
  });
});
