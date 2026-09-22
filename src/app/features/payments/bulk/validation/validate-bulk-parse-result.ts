import {
  BulkCsvRow,
  BulkParseResult,
  BulkRowError,
  BulkValidatedRow,
  BulkValidationOptions,
  BulkValidationResult,
} from '../models/bulk-payment.models';
import { duplicateClientReferenceErrors } from './duplicate-client-references';
import { toBulkValidationSummary } from './to-bulk-validation-summary';
import { validateBulkRow } from './validate-bulk-row';

export function validateBulkParseResult(
  parsed: BulkParseResult,
  options: BulkValidationOptions = {},
): BulkValidationResult {
  const duplicateErrors = duplicateClientReferenceErrors(parsed.rows);
  const parsedByLine = new Map(parsed.rows.map((row) => [row.lineNumber, row]));
  const errorsByLine = groupErrors([
    ...parsed.rowErrors.filter((error) => error.code === 'COLUMN_COUNT'),
    ...parsed.rows.flatMap((row) => validateBulkRow(row, options)),
    ...duplicateErrors,
  ]);

  const rows = allLineNumbers(parsed, errorsByLine).map((lineNumber) =>
    toValidatedRow(
      lineNumber,
      parsedByLine.get(lineNumber) ?? null,
      errorsByLine.get(lineNumber) ?? [],
    ),
  );

  return { rows, summary: toBulkValidationSummary(rows) };
}

function groupErrors(errors: BulkRowError[]): Map<number, BulkRowError[]> {
  const grouped = new Map<number, BulkRowError[]>();
  for (const error of errors) {
    const list = grouped.get(error.lineNumber) ?? [];
    list.push(error);
    grouped.set(error.lineNumber, list);
  }
  return grouped;
}

function allLineNumbers(
  parsed: BulkParseResult,
  errorsByLine: Map<number, BulkRowError[]>,
): number[] {
  const lines = new Set<number>([
    ...parsed.rows.map((row) => row.lineNumber),
    ...errorsByLine.keys(),
  ]);
  return [...lines].sort((left, right) => left - right);
}

function toValidatedRow(
  lineNumber: number,
  row: BulkCsvRow | null,
  errors: BulkRowError[],
): BulkValidatedRow {
  return {
    lineNumber,
    clientReference: row?.clientReference ?? errors[0]?.clientReference ?? '',
    row,
    errors,
  };
}
