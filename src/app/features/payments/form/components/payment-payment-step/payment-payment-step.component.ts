import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PaymentType } from '../../../shared/enums/payment.enums';
import { PaymentDetailsFormGroup } from '../../models/payment-form.models';

export interface PaymentCurrencyOption {
  code: string;
  minorUnits: number;
}

@Component({
  selector: 'app-payment-payment-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './payment-payment-step.component.html',
})
export class PaymentPaymentStepComponent {
  readonly paymentForm = input.required<PaymentDetailsFormGroup>();
  readonly currencies = input.required<PaymentCurrencyOption[]>();
  readonly purposeCodes = input<string[]>([]);
  readonly chargeOptions = input<string[]>([]);
  readonly paymentType = input<PaymentType | ''>('');

  readonly isInternational = computed(() => this.paymentType() === PaymentType.International);
}
