import { BulkCsvRow, BulkRowError, BulkValidationOptions } from '../models/bulk-payment.models';
import { amountFieldErrors } from './amount-errors';
import { currencyFieldErrors } from './currency-errors';
import { executionDateErrors } from './execution-date-errors';
import { requiredBulkFieldErrors } from './required-bulk-fields';
import { todayDateInputValue } from '../../../../shared/utils/date-input';

export function validateBulkRow(
  row: BulkCsvRow,
  options: BulkValidationOptions = {},
): BulkRowError[] {
  return [
    ...requiredBulkFieldErrors(row),
    ...amountFieldErrors(row),
    ...currencyFieldErrors(row, options.currencies),
    ...executionDateErrors(row, options.today ?? todayDateInputValue()),
  ];
}
