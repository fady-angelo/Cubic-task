import { isValidPage, pageItems, rangeEnd, rangeStart, totalPages } from './pagination';

describe('pagination utils', () => {
  it('computes total pages', () => {
    expect(totalPages(24, 20)).toBe(2);
    expect(totalPages(0, 20)).toBe(1);
    expect(totalPages(20_000, 20)).toBe(1000);
  });

  it('builds a compact page window', () => {
    expect(pageItems(5, 20)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 20]);
  });

  it('computes visible range', () => {
    expect(rangeStart(2, 20)).toBe(21);
    expect(rangeEnd(2, 20, 24)).toBe(24);
  });

  it('validates page numbers', () => {
    expect(isValidPage(0, 2)).toBe(false);
    expect(isValidPage(2, 2)).toBe(true);
  });
});
