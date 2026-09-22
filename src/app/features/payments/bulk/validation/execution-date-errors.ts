import { BulkCsvRow, BulkRowError } from '../models/bulk-payment.models';
import { bulkRowError } from './bulk-row-error';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function executionDateErrors(row: BulkCsvRow, today: string): BulkRowError[] {
  if (row.executionDate === '') {
    return [];
  }
  if (!isCalendarDate(row.executionDate)) {
    return [
      bulkRowError(
        row.lineNumber,
        row.clientReference,
        'executionDate',
        'INVALID_DATE',
        'Execution date must be a valid calendar date.',
      ),
    ];
  }
  if (row.executionDate < today) {
    return [
      bulkRowError(
        row.lineNumber,
        row.clientReference,
        'executionDate',
        'PAST_DATE',
        'Execution date cannot be in the past.',
      ),
    ];
  }
  return [];
}

function isCalendarDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
