import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LabelValue } from '../../../../../shared/models/label-value';

export type PaymentQueueFilterForm = FormGroup<{
  search: FormControl<string>;
  status: FormControl<string>;
  type: FormControl<string>;
  currency: FormControl<string>;
  dateFrom: FormControl<string>;
  dateTo: FormControl<string>;
}>;

@Component({
  selector: 'app-payment-queue-filters',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-queue-filters.component.html',
})
export class PaymentQueueFiltersComponent {
  readonly form = input.required<PaymentQueueFilterForm>();
  readonly statusOptions = input.required<LabelValue[]>();
  readonly typeOptions = input.required<LabelValue[]>();
  readonly hasValues = input(false);

  clear(): void {
    this.form().reset({
      search: '',
      status: '',
      type: '',
      currency: '',
      dateFrom: '',
      dateTo: '',
    });
  }
}
