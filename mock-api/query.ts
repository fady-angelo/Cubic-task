import { PaymentRecord, PAYMENT_STATUS_OPTIONS, PAYMENT_TYPE_OPTIONS } from './data';

export interface PaymentListQuery {
  page: number;
  pageSize: number;
  sort?: string;
  direction?: string;
  q?: string;
  status?: string;
  type?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function queryFromRequest(query: Record<string, unknown>): PaymentListQuery {
  const read = (key: string): string | undefined => {
    const value = query[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  };
  return {
    page: Math.max(1, Number(read('page') ?? 1)),
    pageSize: Math.max(1, Number(read('pageSize') ?? 20)),
    sort: read('sort'),
    direction: read('direction'),
    q: read('q'),
    status: read('status'),
    type: read('type'),
    currency: read('currency'),
    dateFrom: read('dateFrom'),
    dateTo: read('dateTo'),
  };
}

export function filterSortPaginate(rows: PaymentRecord[], query: PaymentListQuery) {
  const filtered = rows.filter((row) => matches(row, query));
  const sorted = applySort(filtered, query.sort, query.direction);
  const start = (query.page - 1) * query.pageSize;
  return {
    items: sorted.slice(start, start + query.pageSize).map(toSummary),
    total: sorted.length,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export function toSummary(row: PaymentRecord) {
  return {
    id: row.id,
    reference: row.reference,
    type: labeled(PAYMENT_TYPE_OPTIONS, row.type),
    status: labeled(PAYMENT_STATUS_OPTIONS, row.status),
    debtorAccountMasked: row.debtorAccountMasked,
    beneficiaryName: row.beneficiaryName,
    currency: row.currency,
    amount: row.amount,
    makerUserId: row.makerUserId,
    makerName: row.makerName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    rowVersion: row.rowVersion,
  };
}

export function labeled<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T,
): { value: T; label: string } {
  return options.find((option) => option.value === value) ?? { value, label: value };
}

function matches(row: PaymentRecord, query: PaymentListQuery): boolean {
  if (query.q) {
    const term = query.q.toLowerCase();
    if (
      !row.reference.toLowerCase().includes(term) &&
      !row.beneficiaryName.toLowerCase().includes(term)
    ) {
      return false;
    }
  }
  if (query.status && row.status !== query.status) return false;
  if (query.type && row.type !== query.type) return false;
  if (query.currency && row.currency.toUpperCase() !== query.currency.toUpperCase()) return false;
  if (query.dateFrom && new Date(row.createdAt).getTime() < new Date(query.dateFrom).getTime()) {
    return false;
  }
  if (query.dateTo) {
    const to = new Date(`${query.dateTo}T23:59:59.999Z`).getTime();
    if (new Date(row.createdAt).getTime() > to) return false;
  }
  return true;
}

function applySort(rows: PaymentRecord[], sort?: string, direction?: string): PaymentRecord[] {
  if (!sort) return rows;
  const dir = direction === 'asc' ? 1 : -1;
  const key = sort as keyof PaymentRecord;
  return [...rows].sort((a, b) => compare(a[key], b[key], dir));
}

function compare(left: unknown, right: unknown, dir: number): number {
  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * dir;
  }
  return String(left).localeCompare(String(right)) * dir;
}
