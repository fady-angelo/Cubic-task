import { BULK_MAX_DATA_ROWS } from '../bulk-payment.constants';
import { BulkIntakeState, BulkValidationOptions } from '../models/bulk-payment.models';
import { countCsvDataRows } from './csv-lines';
import { parseBulkCsv } from './parse-bulk-csv';
import { validateBulkParseResult } from '../validation/validate-bulk-parse-result';

export function intakeBulkCsvText(
  fileName: string,
  text: string,
  options: BulkValidationOptions = {},
): BulkIntakeState {
  if (countCsvDataRows(text) > BULK_MAX_DATA_ROWS) {
    return {
      kind: 'rejected',
      fileName,
      reject: {
        reason: 'too-many-rows',
        message: 'File must contain at most 2,000 data rows.',
      },
    };
  }

  const parsed = parseBulkCsv(text);
  if (!parsed.ok) {
    return { kind: 'rejected', fileName, reject: parsed.reject };
  }

  return {
    kind: 'parsed',
    fileName,
    csvText: text,
    result: parsed.result,
    validation: validateBulkParseResult(parsed.result, options),
  };
}
