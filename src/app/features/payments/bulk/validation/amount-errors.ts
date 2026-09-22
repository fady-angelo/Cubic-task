import { BulkCsvRow, BulkRowError } from '../models/bulk-payment.models';
import { bulkRowError } from './bulk-row-error';

export function amountFieldErrors(row: BulkCsvRow): BulkRowError[] {
  if (row.amount === '') {
    return [];
  }
  const amount = Number(row.amount);
  if (!Number.isFinite(amount)) {
    return [
      bulkRowError(
        row.lineNumber,
        row.clientReference,
        'amount',
        'UNREADABLE_AMOUNT',
        'Amount is not a number.',
      ),
    ];
  }
  if (amount <= 0) {
    return [
      bulkRowError(
        row.lineNumber,
        row.clientReference,
        'amount',
        'NOT_POSITIVE',
        'Amount must be greater than zero.',
      ),
    ];
  }
  return [];
}

export function amountFitsMinorUnits(amount: number, minorUnits: number): boolean {
  const factor = 10 ** minorUnits;
  const scaled = amount * factor;
  return Math.abs(Math.round(scaled) - scaled) < 1e-8;
}
