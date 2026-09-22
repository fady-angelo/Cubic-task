import { FormControl } from '@angular/forms';
import { toDateInputValue } from '../../../../shared/utils/date-input';
import { notPastDateValidator } from './not-in-the-past.validator';

describe('notPastDateValidator', () => {
  it('rejects a date before today and accepts today and future dates', () => {
    const control = new FormControl('', { nonNullable: true });
    const yesterday = shiftDays(-1);
    const today = toDateInputValue(new Date());
    const tomorrow = shiftDays(1);

    control.setValue(yesterday);
    expect(notPastDateValidator(control)).toEqual({ pastDate: true });

    control.setValue(today);
    expect(notPastDateValidator(control)).toBeNull();

    control.setValue(tomorrow);
    expect(notPastDateValidator(control)).toBeNull();
  });
});

function shiftDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}
