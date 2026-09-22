import { BULK_CSV_COLUMNS } from '../bulk-payment.constants';
import { BulkCsvColumn, BulkCsvRow, BulkRowError } from '../models/bulk-payment.models';
import { bulkRowError } from './bulk-row-error';

export function requiredBulkFieldErrors(row: BulkCsvRow): BulkRowError[] {
  return BULK_CSV_COLUMNS.flatMap((field) => {
    if (row[field] !== '') {
      return [];
    }
    return [requiredError(row, field)];
  });
}

function requiredError(row: BulkCsvRow, field: BulkCsvColumn): BulkRowError {
  return bulkRowError(
    row.lineNumber,
    row.clientReference,
    field,
    'REQUIRED',
    `${field} is required.`,
  );
}
