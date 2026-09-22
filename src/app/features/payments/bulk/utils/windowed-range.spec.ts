import { windowedRange } from './windowed-range';

describe('windowedRange', () => {
  it('does not cover the full list when the list is long', () => {
    const range = windowedRange(2000, 0, 56, 320, 6);
    expect(range.end - range.start).toBeLessThan(50);
    expect(range.start).toBe(0);
  });

  it('moves the window when scrolled', () => {
    const range = windowedRange(2000, 560, 56, 320, 6);
    expect(range.start).toBeGreaterThan(0);
    expect(range.end).toBeLessThan(2000);
  });
});
