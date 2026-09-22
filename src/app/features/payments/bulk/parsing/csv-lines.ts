export interface CsvRecord {
  lineNumber: number;
  line: string;
}

export function nonEmptyCsvRecords(text: string): CsvRecord[] {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ lineNumber: index + 1, line }))
    .filter((record) => record.line.trim().length > 0);
}

export function countCsvDataRows(text: string): number {
  const records = nonEmptyCsvRecords(text);
  if (records.length === 0) {
    return 0;
  }
  return records.length - 1;
}

export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (inQuotes) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells;
}
