import { FormControl } from '@angular/forms';
import { positiveAmountValidator } from './positive-amount.validator';

describe('positiveAmountValidator', () => {
  it('rejects zero and negative amounts and accepts a positive amount', () => {
    const control = new FormControl<number | null>(null);

    control.setValue(0);
    expect(positiveAmountValidator(control)).toEqual({ notPositive: true });

    control.setValue(-1);
    expect(positiveAmountValidator(control)).toEqual({ notPositive: true });

    control.setValue(0.01);
    expect(positiveAmountValidator(control)).toBeNull();
  });
});
