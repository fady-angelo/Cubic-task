import { BulkCsvRow, BulkCurrencyMinorUnits, BulkRowError } from '../models/bulk-payment.models';
import { amountFitsMinorUnits } from './amount-errors';
import { bulkRowError } from './bulk-row-error';

export function currencyFieldErrors(
  row: BulkCsvRow,
  currencies: BulkCurrencyMinorUnits[] | undefined,
): BulkRowError[] {
  if (!currencies || row.currency === '') {
    return [];
  }
  const match = currencies.find((item) => item.code === row.currency);
  if (!match) {
    return [
      bulkRowError(
        row.lineNumber,
        row.clientReference,
        'currency',
        'UNKNOWN_CURRENCY',
        'Currency is not in the reference list.',
      ),
    ];
  }
  return precisionError(row, match.minorUnits);
}

function precisionError(row: BulkCsvRow, minorUnits: number): BulkRowError[] {
  const amount = Number(row.amount);
  if (!Number.isFinite(amount) || amountFitsMinorUnits(amount, minorUnits)) {
    return [];
  }
  return [
    bulkRowError(
      row.lineNumber,
      row.clientReference,
      'amount',
      'CURRENCY_PRECISION',
      'Amount has too many decimal places for this currency.',
    ),
  ];
}
