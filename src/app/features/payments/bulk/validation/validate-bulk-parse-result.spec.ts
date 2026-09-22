import { BulkCsvRow, BulkParseResult } from '../models/bulk-payment.models';
import { validateBulkParseResult } from './validate-bulk-parse-result';

const today = '2026-09-22';

describe('validateBulkParseResult', () => {
  it('summarises a mixed file', () => {
    const parsed = parseResult([
      csvRow(2, 'REF1', 'GBP', '10'),
      csvRow(3, 'REF2', 'USD', '5'),
      csvRow(4, 'REF3', 'GBP', '0'),
    ]);
    const { summary } = validateBulkParseResult(parsed, { today });
    expect(summary.totalRows).toBe(3);
    expect(summary.validRows).toBe(2);
    expect(summary.invalidRows).toBe(1);
    expect(summary.duplicateClientReferenceCount).toBe(0);
    expect(summary.amountByCurrency).toEqual([
      { currency: 'GBP', amount: 10 },
      { currency: 'USD', amount: 5 },
    ]);
  });

  it('returns zeros for an empty file', () => {
    const { summary } = validateBulkParseResult({ rows: [], rowErrors: [] }, { today });
    expect(summary).toEqual({
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicateClientReferenceCount: 0,
      amountByCurrency: [],
    });
  });

  it('does not aggregate amounts when every row is invalid', () => {
    const parsed = parseResult([csvRow(2, 'REF1', 'GBP', '0'), csvRow(3, 'REF1', 'USD', '-4')]);
    const { summary, rows } = validateBulkParseResult(parsed, { today });
    expect(summary.validRows).toBe(0);
    expect(summary.invalidRows).toBe(2);
    expect(summary.duplicateClientReferenceCount).toBe(1);
    expect(summary.amountByCurrency).toEqual([]);
    expect(rows.every((row) => row.errors.length > 0)).toBe(true);
  });
});

function parseResult(rows: BulkCsvRow[]): BulkParseResult {
  return { rows, rowErrors: [] };
}

function csvRow(
  lineNumber: number,
  clientReference: string,
  currency: string,
  amount: string,
): BulkCsvRow {
  return {
    lineNumber,
    clientReference,
    beneficiaryName: 'Acme',
    beneficiaryAccount: 'ACC1',
    bankCodeOrSwift: 'NWBK',
    currency,
    amount,
    executionDate: '2026-09-23',
    purposeCode: 'SALA',
  };
}
