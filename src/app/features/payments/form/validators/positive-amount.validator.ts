import { AbstractControl, ValidationErrors } from '@angular/forms';

export function positiveAmountValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { notPositive: true };
  }
  return null;
}
