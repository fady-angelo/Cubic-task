import { BULK_CSV_COLUMNS } from '../bulk-payment.constants';

export type BulkCsvColumn = (typeof BULK_CSV_COLUMNS)[number];

export interface BulkCsvRow {
  lineNumber: number;
  clientReference: string;
  beneficiaryName: string;
  beneficiaryAccount: string;
  bankCodeOrSwift: string;
  currency: string;
  amount: string;
  executionDate: string;
  purposeCode: string;
}

export type BulkFileRejectReason = 'not-csv' | 'too-large' | 'too-many-rows' | 'invalid-header';

export interface BulkFileReject {
  reason: BulkFileRejectReason;
  message: string;
}

export type BulkErrorSource = 'local' | 'server';

export interface BulkRowError {
  lineNumber: number;
  clientReference: string;
  field: BulkCsvColumn | null;
  code: string;
  message: string;
  source?: BulkErrorSource;
}

export interface BulkRejectedRow {
  row: number;
  clientReference: string;
  code: string;
  message: string;
}

export interface BulkSubmitResult {
  batchId: string;
  receivedRows: number;
  acceptedRows: number;
  rejectedRows: BulkRejectedRow[];
  status: string;
}

export interface BulkParseResult {
  rows: BulkCsvRow[];
  rowErrors: BulkRowError[];
}

export type BulkFileAcceptance = { ok: true } | { ok: false; reject: BulkFileReject };

export type BulkCsvParseOutcome =
  { ok: true; result: BulkParseResult } | { ok: false; reject: BulkFileReject };

export interface BulkCurrencyMinorUnits {
  code: string;
  minorUnits: number;
}

export interface BulkValidationOptions {
  currencies?: BulkCurrencyMinorUnits[];
  today?: string;
}

export interface BulkValidatedRow {
  lineNumber: number;
  clientReference: string;
  row: BulkCsvRow | null;
  errors: BulkRowError[];
}

export interface BulkAmountByCurrency {
  currency: string;
  amount: number;
}

export interface BulkValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateClientReferenceCount: number;
  amountByCurrency: BulkAmountByCurrency[];
}

export interface BulkValidationResult {
  rows: BulkValidatedRow[];
  summary: BulkValidationSummary;
}

export type BulkIntakeState =
  | { kind: 'idle' }
  | { kind: 'working'; fileName: string }
  | { kind: 'rejected'; fileName: string; reject: BulkFileReject }
  | {
      kind: 'parsed';
      fileName: string;
      csvText: string;
      result: BulkParseResult;
      validation: BulkValidationResult;
    };
