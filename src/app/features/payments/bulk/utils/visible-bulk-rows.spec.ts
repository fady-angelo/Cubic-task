import { BulkValidatedRow } from '../models/bulk-payment.models';
import { visibleBulkRows } from './visible-bulk-rows';

describe('visibleBulkRows', () => {
  const rows: BulkValidatedRow[] = [
    { lineNumber: 2, clientReference: 'REF1', row: null, errors: [] },
    {
      lineNumber: 3,
      clientReference: 'REF2',
      row: null,
      errors: [
        {
          lineNumber: 3,
          clientReference: 'REF2',
          field: 'beneficiaryName',
          code: 'REQUIRED',
          message: 'beneficiaryName is required.',
        },
      ],
    },
  ];

  it('returns every row when the filter is off', () => {
    expect(visibleBulkRows(rows, false)).toHaveLength(2);
  });

  it('hides valid rows when invalid-only is on', () => {
    expect(visibleBulkRows(rows, true).map((row) => row.clientReference)).toEqual(['REF2']);
  });
});
