import { displayedDebtorAccount } from './payment-display';

describe('payment-display', () => {
  it('masks the debit account unless VIEW_FULL_ACCOUNT is granted', () => {
    const account = { id: 'acc-1', masked: '**** 4412', full: 'GB00FULL4412' };
    expect(displayedDebtorAccount(account, false)).toBe('**** 4412');
    expect(displayedDebtorAccount(account, true)).toBe('GB00FULL4412');
  });
});
