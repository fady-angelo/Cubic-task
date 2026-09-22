import { BulkCsvRow, BulkRowError } from '../models/bulk-payment.models';
import { bulkRowError } from './bulk-row-error';

export function duplicateClientReferenceErrors(rows: BulkCsvRow[]): BulkRowError[] {
  const counts = countByReference(rows);
  return rows.flatMap((row) => {
    if (row.clientReference === '' || (counts.get(row.clientReference) ?? 0) < 2) {
      return [];
    }
    return [
      bulkRowError(
        row.lineNumber,
        row.clientReference,
        'clientReference',
        'DUPLICATE_CLIENT_REFERENCE',
        'clientReference is duplicated in this file.',
      ),
    ];
  });
}

export function duplicateClientReferenceCount(rows: BulkCsvRow[]): number {
  let count = 0;
  for (const occurrences of countByReference(rows).values()) {
    if (occurrences > 1) {
      count += 1;
    }
  }
  return count;
}

function countByReference(rows: BulkCsvRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.clientReference === '') {
      continue;
    }
    counts.set(row.clientReference, (counts.get(row.clientReference) ?? 0) + 1);
  }
  return counts;
}
