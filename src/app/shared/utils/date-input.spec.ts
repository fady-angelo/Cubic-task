import { toDateInputValue, todayDateInputValue } from './date-input';

describe('date-input', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(toDateInputValue(new Date(2026, 8, 22))).toBe('2026-09-22');
  });

  it('takes the date part of an ISO string', () => {
    expect(toDateInputValue('2026-12-01T00:00:00.000Z')).toBe('2026-12-01');
  });

  it('returns today as YYYY-MM-DD', () => {
    expect(todayDateInputValue()).toBe(toDateInputValue(new Date()));
  });
});
