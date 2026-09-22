import { BulkRejectedRow, BulkRowError, BulkValidatedRow } from '../models/bulk-payment.models';
import { bulkRowError } from '../validation/bulk-row-error';

export function mergeBulkServerRejects(
  rows: BulkValidatedRow[],
  rejectedRows: BulkRejectedRow[],
): BulkValidatedRow[] {
  const merged = new Map(rows.map((row) => [row.lineNumber, { ...row, errors: [...row.errors] }]));
  for (const rejected of rejectedRows) {
    const error = serverRowError(rejected);
    const existing = merged.get(rejected.row);
    if (existing) {
      existing.errors.push(error);
      continue;
    }
    merged.set(rejected.row, {
      lineNumber: rejected.row,
      clientReference: rejected.clientReference,
      row: null,
      errors: [error],
    });
  }
  return [...merged.values()].sort((left, right) => left.lineNumber - right.lineNumber);
}

function serverRowError(rejected: BulkRejectedRow): BulkRowError {
  const error = bulkRowError(
    rejected.row,
    rejected.clientReference,
    null,
    rejected.code,
    rejected.message,
  );
  return { ...error, source: 'server' };
}
