import { BULK_CSV_COLUMNS } from '../bulk-payment.constants';
import { countCsvDataRows, parseCsvLine } from './csv-lines';
import { parseBulkCsv } from './parse-bulk-csv';

const HEADER = BULK_CSV_COLUMNS.join(',');

describe('parseCsvLine', () => {
  it('splits quoted commas', () => {
    expect(parseCsvLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd']);
  });

  it('unescapes doubled quotes', () => {
    expect(parseCsvLine('"a""b"')).toEqual(['a"b']);
  });
});

describe('parseBulkCsv', () => {
  it('parses a valid header and row', () => {
    const outcome = parseBulkCsv(`${HEADER}\nREF1,Acme,ACC1,NWBK,GBP,10.00,2026-09-23,SALA`);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.result.rows).toHaveLength(1);
    expect(outcome.result.rows[0].clientReference).toBe('REF1');
    expect(outcome.result.rowErrors).toHaveLength(0);
  });

  it('rejects a missing or wrong header', () => {
    const missing = parseBulkCsv('');
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.reject.reason).toBe('invalid-header');
    }
    const wrong = parseBulkCsv('foo,bar\n1,2');
    expect(wrong.ok).toBe(false);
  });

  it('records extra or missing cells as row errors', () => {
    const extra = parseBulkCsv(`${HEADER}\nREF1,Acme,ACC1,NWBK,GBP,10.00,2026-09-23,SALA,extra`);
    expect(extra.ok).toBe(true);
    if (extra.ok) {
      expect(extra.result.rows).toHaveLength(0);
      expect(extra.result.rowErrors[0]?.code).toBe('COLUMN_COUNT');
    }

    const missing = parseBulkCsv(`${HEADER}\nREF1,Acme`);
    expect(missing.ok).toBe(true);
    if (missing.ok) {
      expect(missing.result.rowErrors[0]?.code).toBe('COLUMN_COUNT');
    }
  });

  it('records an unreadable amount as a row error and keeps the row', () => {
    const outcome = parseBulkCsv(`${HEADER}\nREF1,Acme,ACC1,NWBK,GBP,abc,2026-09-23,SALA`);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.result.rows).toHaveLength(1);
    expect(outcome.result.rowErrors[0]?.code).toBe('UNREADABLE_AMOUNT');
  });

  it('uses original file line numbers after blank lines', () => {
    const outcome = parseBulkCsv(`${HEADER}\n\nREF1,Acme,ACC1,NWBK,GBP,10,2026-09-23,SALA`);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.rows[0]?.lineNumber).toBe(3);
    }
  });
});

describe('countCsvDataRows', () => {
  it('does not count the header or blank lines', () => {
    expect(countCsvDataRows(`${HEADER}\n\nrow\n`)).toBe(1);
    expect(countCsvDataRows('')).toBe(0);
  });
});
