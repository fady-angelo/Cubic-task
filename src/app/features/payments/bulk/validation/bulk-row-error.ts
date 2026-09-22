import { BulkCsvColumn, BulkRowError } from '../models/bulk-payment.models';

export function bulkRowError(
  lineNumber: number,
  clientReference: string,
  field: BulkCsvColumn | null,
  code: string,
  message: string,
): BulkRowError {
  return { lineNumber, clientReference, field, code, message };
}
