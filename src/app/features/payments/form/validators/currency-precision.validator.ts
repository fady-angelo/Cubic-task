import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function currencyPrecisionValidator(getMinorUnits: () => number | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const minorUnits = getMinorUnits();
    const value = control.value;
    if (value === null || value === '' || minorUnits === undefined) {
      return null;
    }
    const amount = Number(value);
    if (Number.isNaN(amount)) {
      return null;
    }
    const factor = 10 ** minorUnits;
    const scaled = amount * factor;
    const fitsMinorUnits = Math.abs(Math.round(scaled) - scaled) < 1e-8;
    return fitsMinorUnits ? null : { currencyPrecision: true };
  };
}
