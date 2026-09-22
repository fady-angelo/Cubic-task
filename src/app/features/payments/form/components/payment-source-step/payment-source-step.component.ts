import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { LabelValue } from '../../../../../shared/models/label-value';
import { AccountSelectOption } from '../../../models/account.models';
import { PaymentSourceFormGroup } from '../../models/payment-form.models';

@Component({
  selector: 'app-payment-source-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ErrorStateComponent],
  templateUrl: './payment-source-step.component.html',
})
export class PaymentSourceStepComponent {
  readonly sourceForm = input.required<PaymentSourceFormGroup>();
  readonly accounts = input.required<AccountSelectOption[]>();
  readonly paymentTypes = input.required<LabelValue[]>();
  readonly minExecutionDate = input.required<string>();
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly retry = output<void>();
}
