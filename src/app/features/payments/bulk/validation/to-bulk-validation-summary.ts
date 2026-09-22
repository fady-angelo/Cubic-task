import {
  BulkAmountByCurrency,
  BulkValidatedRow,
  BulkValidationSummary,
} from '../models/bulk-payment.models';

export function toBulkValidationSummary(rows: BulkValidatedRow[]): BulkValidationSummary {
  const invalidRows = rows.filter((item) => item.errors.length > 0);
  return {
    totalRows: rows.length,
    validRows: rows.length - invalidRows.length,
    invalidRows: invalidRows.length,
    duplicateClientReferenceCount: uniqueDuplicateReferences(rows),
    amountByCurrency: sumValidAmountsByCurrency(rows),
  };
}

function uniqueDuplicateReferences(rows: BulkValidatedRow[]): number {
  const refs = new Set(
    rows
      .filter((item) => item.errors.some((error) => error.code === 'DUPLICATE_CLIENT_REFERENCE'))
      .map((item) => item.clientReference),
  );
  return refs.size;
}

function sumValidAmountsByCurrency(rows: BulkValidatedRow[]): BulkAmountByCurrency[] {
  const totals = new Map<string, number>();
  for (const item of rows) {
    if (item.errors.length > 0 || !item.row) {
      continue;
    }
    const amount = Number(item.row.amount);
    totals.set(item.row.currency, (totals.get(item.row.currency) ?? 0) + amount);
  }
  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, amount]) => ({ currency, amount }));
}
