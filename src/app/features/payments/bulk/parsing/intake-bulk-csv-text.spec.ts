import { BULK_CSV_COLUMNS, BULK_MAX_DATA_ROWS } from '../bulk-payment.constants';
import { intakeBulkCsvText } from './intake-bulk-csv-text';

const HEADER = BULK_CSV_COLUMNS.join(',');

describe('intakeBulkCsvText', () => {
  it('parses a valid small CSV', () => {
    const state = intakeBulkCsvText(
      'ok.csv',
      `${HEADER}\nREF1,Acme,ACC1,NWBK,GBP,10.00,2026-09-23,SALA`,
      { today: '2026-09-22' },
    );
    expect(state.kind).toBe('parsed');
    if (state.kind === 'parsed') {
      expect(state.validation.summary.validRows).toBe(1);
    }
  });

  it('rejects more than 2,000 data rows before parse errors', () => {
    const rows = Array.from(
      { length: BULK_MAX_DATA_ROWS + 1 },
      (_, index) => `REF${index},Acme,ACC1,NWBK,GBP,10,2026-09-23,SALA`,
    );
    const state = intakeBulkCsvText('big.csv', `${HEADER}\n${rows.join('\n')}`);
    expect(state.kind).toBe('rejected');
    if (state.kind === 'rejected') {
      expect(state.reject.reason).toBe('too-many-rows');
    }
  });

  it('rejects an invalid header', () => {
    const state = intakeBulkCsvText('bad.csv', 'nope\n1');
    expect(state.kind).toBe('rejected');
    if (state.kind === 'rejected') {
      expect(state.reject.reason).toBe('invalid-header');
    }
  });
});
