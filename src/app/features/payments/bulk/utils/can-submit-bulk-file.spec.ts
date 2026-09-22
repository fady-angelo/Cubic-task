import { canSubmitBulkFile } from './can-submit-bulk-file';
import { intakeBulkCsvText } from '../parsing/intake-bulk-csv-text';
import { BULK_CSV_COLUMNS } from '../bulk-payment.constants';

const HEADER = BULK_CSV_COLUMNS.join(',');

describe('canSubmitBulkFile', () => {
  it('allows a parsed file with only valid rows', () => {
    const state = intakeBulkCsvText(
      'ok.csv',
      `${HEADER}\nREF1,Acme,ACC1,NWBK,GBP,10.00,2026-09-23,SALA`,
      { today: '2026-09-22' },
    );
    expect(canSubmitBulkFile(state, false)).toBe(true);
  });

  it('blocks local validation errors and in-flight submit', () => {
    const invalid = intakeBulkCsvText(
      'bad.csv',
      `${HEADER}\nREF1,,ACC1,NWBK,GBP,10.00,2026-09-23,SALA`,
      { today: '2026-09-22' },
    );
    expect(canSubmitBulkFile(invalid, false)).toBe(false);
    const valid = intakeBulkCsvText(
      'ok.csv',
      `${HEADER}\nREF1,Acme,ACC1,NWBK,GBP,10.00,2026-09-23,SALA`,
      { today: '2026-09-22' },
    );
    expect(canSubmitBulkFile(valid, true)).toBe(false);
  });
});
