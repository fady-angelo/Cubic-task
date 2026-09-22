import { BULK_MAX_FILE_BYTES } from '../bulk-payment.constants';
import { acceptBulkCsvFile } from './accept-bulk-csv-file';

describe('acceptBulkCsvFile', () => {
  it('accepts a small CSV', () => {
    expect(acceptBulkCsvFile(csvFile('ok.csv', 'a', 'text/csv')).ok).toBe(true);
  });

  it('accepts a CSV with an empty MIME type', () => {
    expect(acceptBulkCsvFile(csvFile('ok.csv', 'a', '')).ok).toBe(true);
  });

  it('rejects a non-CSV extension', () => {
    const result = acceptBulkCsvFile(csvFile('notes.txt', 'a', 'text/plain'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reject.reason).toBe('not-csv');
    }
  });

  it('rejects a file larger than 5 MB', () => {
    const result = acceptBulkCsvFile(
      new File([new Uint8Array(BULK_MAX_FILE_BYTES + 1)], 'big.csv', { type: 'text/csv' }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reject.reason).toBe('too-large');
    }
  });

  it('accepts a file of exactly 5 MB', () => {
    expect(
      acceptBulkCsvFile(
        new File([new Uint8Array(BULK_MAX_FILE_BYTES)], 'edge.csv', { type: 'text/csv' }),
      ).ok,
    ).toBe(true);
  });
});

function csvFile(name: string, contents: string, type: string): File {
  return new File([contents], name, { type });
}
