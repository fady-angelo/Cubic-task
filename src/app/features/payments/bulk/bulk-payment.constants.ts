export const BULK_CSV_COLUMNS = [
  'clientReference',
  'beneficiaryName',
  'beneficiaryAccount',
  'bankCodeOrSwift',
  'currency',
  'amount',
  'executionDate',
  'purposeCode',
] as const;

export const BULK_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const BULK_MAX_DATA_ROWS = 2000;
export const BULK_ROW_ITEM_HEIGHT_PX = 56;
export const BULK_ROW_VIEWPORT_HEIGHT_PX = 320;
export const BULK_ROW_OVERSCAN = 6;
