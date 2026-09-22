import { BulkCsvRow } from '../models/bulk-payment.models';
import {
  duplicateClientReferenceCount,
  duplicateClientReferenceErrors,
} from './duplicate-client-references';

describe('duplicateClientReferenceErrors', () => {
  it('does not flag unique references', () => {
    const rows = [csvRow(2, 'REF1'), csvRow(3, 'REF2')];
    expect(duplicateClientReferenceErrors(rows)).toHaveLength(0);
    expect(duplicateClientReferenceCount(rows)).toBe(0);
  });

  it('flags every row that shares a clientReference', () => {
    const rows = [csvRow(2, 'REF1'), csvRow(3, 'REF1'), csvRow(4, 'REF2')];
    const errors = duplicateClientReferenceErrors(rows);
    expect(errors).toHaveLength(2);
    expect(errors.map((error) => error.lineNumber)).toEqual([2, 3]);
    expect(duplicateClientReferenceCount(rows)).toBe(1);
  });
});

function csvRow(lineNumber: number, clientReference: string): BulkCsvRow {
  return {
    lineNumber,
    clientReference,
    beneficiaryName: 'Acme',
    beneficiaryAccount: 'ACC1',
    bankCodeOrSwift: 'NWBK',
    currency: 'GBP',
    amount: '10.00',
    executionDate: '2026-09-23',
    purposeCode: 'SALA',
  };
}
