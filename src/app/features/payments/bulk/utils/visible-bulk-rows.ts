import { BulkValidatedRow } from '../models/bulk-payment.models';

export function visibleBulkRows(
  rows: BulkValidatedRow[],
  invalidOnly: boolean,
): BulkValidatedRow[] {
  if (!invalidOnly) {
    return rows;
  }
  return rows.filter((row) => row.errors.length > 0);
}
