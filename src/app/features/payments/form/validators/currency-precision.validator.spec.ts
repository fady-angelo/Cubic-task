import { FormControl } from '@angular/forms';
import { currencyPrecisionValidator } from './currency-precision.validator';

describe('currencyPrecisionValidator', () => {
  it('rejects extra decimals for the selected currency minor units', () => {
    const control = new FormControl<number | null>(null);
    const gbp = currencyPrecisionValidator(() => 2);
    const jpy = currencyPrecisionValidator(() => 0);

    control.setValue(10.12);
    expect(gbp(control)).toBeNull();

    control.setValue(10.123);
    expect(gbp(control)).toEqual({ currencyPrecision: true });

    control.setValue(10);
    expect(jpy(control)).toBeNull();

    control.setValue(10.5);
    expect(jpy(control)).toEqual({ currencyPrecision: true });
  });
});
