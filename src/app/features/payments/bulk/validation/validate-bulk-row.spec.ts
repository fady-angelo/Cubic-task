import { BulkCsvRow } from '../models/bulk-payment.models';
import { validateBulkRow } from './validate-bulk-row';

describe('validateBulkRow', () => {
  const today = '2026-09-22';

  it('flags empty beneficiary name and account', () => {
    const errors = validateBulkRow(csvRow({ beneficiaryName: '', beneficiaryAccount: '' }), {
      today,
    });
    expect(codes(errors)).toContain('REQUIRED');
    expect(errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['beneficiaryName', 'beneficiaryAccount']),
    );
  });

  it('rejects zero and negative amounts', () => {
    expect(codes(validateBulkRow(csvRow({ amount: '0' }), { today }))).toContain('NOT_POSITIVE');
    expect(codes(validateBulkRow(csvRow({ amount: '-1' }), { today }))).toContain('NOT_POSITIVE');
  });

  it('rejects an execution date in the past and accepts today', () => {
    expect(codes(validateBulkRow(csvRow({ executionDate: '2026-09-21' }), { today }))).toContain(
      'PAST_DATE',
    );
    expect(validateBulkRow(csvRow({ executionDate: today }), { today })).toHaveLength(0);
  });

  it('rejects extra decimals when currency minor units are known', () => {
    const errors = validateBulkRow(csvRow({ amount: '10.123' }), {
      today,
      currencies: [{ code: 'GBP', minorUnits: 2 }],
    });
    expect(codes(errors)).toContain('CURRENCY_PRECISION');
  });
});

function csvRow(overrides: Partial<BulkCsvRow> = {}): BulkCsvRow {
  return {
    lineNumber: 2,
    clientReference: 'REF1',
    beneficiaryName: 'Acme',
    beneficiaryAccount: 'ACC1',
    bankCodeOrSwift: 'NWBK',
    currency: 'GBP',
    amount: '10.00',
    executionDate: '2026-09-23',
    purposeCode: 'SALA',
    ...overrides,
  };
}

function codes(errors: { code: string }[]): string[] {
  return errors.map((error) => error.code);
}
