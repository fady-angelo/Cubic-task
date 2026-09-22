import { AbstractControl, ValidationErrors } from '@angular/forms';

export function notPastDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value || typeof value !== 'string') {
    return null;
  }
  const selected = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected < today ? { pastDate: true } : null;
}
