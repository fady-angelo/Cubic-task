import { BulkValidatedRow } from '../models/bulk-payment.models';
import { mergeBulkServerRejects } from './merge-bulk-server-rejects';

describe('mergeBulkServerRejects', () => {
  it('keeps local errors and appends server rejects', () => {
    const local: BulkValidatedRow[] = [
      {
        lineNumber: 2,
        clientReference: 'REF1',
        row: null,
        errors: [
          {
            lineNumber: 2,
            clientReference: 'REF1',
            field: 'beneficiaryName',
            code: 'REQUIRED',
            message: 'beneficiaryName is required.',
          },
        ],
      },
      { lineNumber: 3, clientReference: 'REF2', row: null, errors: [] },
    ];
    const merged = mergeBulkServerRejects(local, [
      { row: 3, clientReference: 'REF2', code: 'INVALID_ROW', message: 'Rejected by server' },
    ]);
    expect(merged[0]?.errors).toHaveLength(1);
    expect(merged[0]?.errors[0]?.code).toBe('REQUIRED');
    expect(merged[1]?.errors).toEqual([
      expect.objectContaining({ source: 'server', message: 'Rejected by server' }),
    ]);
  });
});
