import { BULK_MAX_FILE_BYTES } from '../bulk-payment.constants';
import { BulkFileAcceptance } from '../models/bulk-payment.models';

const CSV_TYPES = new Set(['', 'text/csv', 'application/csv']);

export function acceptBulkCsvFile(file: File): BulkFileAcceptance {
  if (!isCsvFile(file)) {
    return {
      ok: false,
      reject: {
        reason: 'not-csv',
        message: 'Only CSV files are accepted.',
      },
    };
  }
  if (file.size > BULK_MAX_FILE_BYTES) {
    return {
      ok: false,
      reject: {
        reason: 'too-large',
        message: 'File must be 5 MB or smaller.',
      },
    };
  }
  return { ok: true };
}

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return name.endsWith('.csv') && CSV_TYPES.has(type);
}
