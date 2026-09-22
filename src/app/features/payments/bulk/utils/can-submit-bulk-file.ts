import { BulkIntakeState } from '../models/bulk-payment.models';

export function canSubmitBulkFile(state: BulkIntakeState, submitting: boolean): boolean {
  if (submitting || state.kind !== 'parsed') {
    return false;
  }
  return state.validation.summary.totalRows > 0 && state.validation.summary.invalidRows === 0;
}
