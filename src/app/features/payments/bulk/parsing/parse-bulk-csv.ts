import { BULK_CSV_COLUMNS } from '../bulk-payment.constants';
import { BulkCsvParseOutcome, BulkCsvRow, BulkRowError } from '../models/bulk-payment.models';
import { nonEmptyCsvRecords, parseCsvLine } from './csv-lines';

const COLUMN_COUNT = BULK_CSV_COLUMNS.length;

export function parseBulkCsv(text: string): BulkCsvParseOutcome {
  const records = nonEmptyCsvRecords(text);
  const header = records[0];
  if (!header || !isExpectedHeader(parseCsvLine(header.line))) {
    return {
      ok: false,
      reject: {
        reason: 'invalid-header',
        message: 'CSV header must match the required columns.',
      },
    };
  }

  const rows: BulkCsvRow[] = [];
  const rowErrors: BulkRowError[] = [];

  for (const record of records.slice(1)) {
    const lineNumber = record.lineNumber;
    const cells = parseCsvLine(record.line).map((cell) => cell.trim());
    const clientReference = cells[0] ?? '';

    if (cells.length !== COLUMN_COUNT) {
      rowErrors.push({
        lineNumber,
        clientReference,
        field: null,
        code: 'COLUMN_COUNT',
        message: 'Row must have exactly eight columns.',
      });
      continue;
    }

    const row = toRow(lineNumber, cells);
    rows.push(row);
    const amountError = unreadableAmountError(row);
    if (amountError) {
      rowErrors.push(amountError);
    }
  }

  return { ok: true, result: { rows, rowErrors } };
}

function isExpectedHeader(cells: string[]): boolean {
  if (cells.length !== COLUMN_COUNT) {
    return false;
  }
  return BULK_CSV_COLUMNS.every((column, index) => cells[index].trim() === column);
}

function toRow(lineNumber: number, cells: string[]): BulkCsvRow {
  return {
    lineNumber,
    clientReference: cells[0],
    beneficiaryName: cells[1],
    beneficiaryAccount: cells[2],
    bankCodeOrSwift: cells[3],
    currency: cells[4],
    amount: cells[5],
    executionDate: cells[6],
    purposeCode: cells[7],
  };
}

function unreadableAmountError(row: BulkCsvRow): BulkRowError | null {
  if (row.amount === '') {
    return null;
  }
  if (Number.isFinite(Number(row.amount))) {
    return null;
  }
  return {
    lineNumber: row.lineNumber,
    clientReference: row.clientReference,
    field: 'amount',
    code: 'UNREADABLE_AMOUNT',
    message: 'Amount is not a number.',
  };
}
