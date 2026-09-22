export interface WindowedRange {
  start: number;
  end: number;
  offsetY: number;
}

export function windowedRange(
  length: number,
  scrollTop: number,
  itemHeight: number,
  viewportHeight: number,
  overscan: number,
): WindowedRange {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visible = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
  const end = Math.min(length, start + visible);
  return { start, end, offsetY: start * itemHeight };
}
