export type PageItem = number | 'ellipsis';

export function totalPages(totalItems: number, pageSize: number): number {
  if (pageSize <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function pageItems(current: number, total: number, window = 7): PageItem[] {
  if (total <= window) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items: PageItem[] = [1];
  if (current > 3) {
    items.push('ellipsis');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let index = start; index <= end; index++) {
    items.push(index);
  }

  if (current < total - 2) {
    items.push('ellipsis');
  }
  if (total > 1) {
    items.push(total);
  }
  return items;
}

export function rangeStart(current: number, pageSize: number): number {
  return (current - 1) * pageSize + 1;
}

export function rangeEnd(current: number, pageSize: number, totalItems: number): number {
  return Math.min(current * pageSize, totalItems);
}

export function isValidPage(page: number, pages: number): boolean {
  return page >= 1 && page <= pages;
}
