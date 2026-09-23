import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { Beneficiary } from '../../../models/beneficiary.models';
import { PaymentType } from '../../../shared/enums/payment.enums';
import { PaymentBeneficiaryFormGroup } from '../../models/payment-form.models';

@Component({
  selector: 'app-payment-beneficiary-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ErrorStateComponent],
  templateUrl: './payment-beneficiary-step.component.html',
})
export class PaymentBeneficiaryStepComponent {
  readonly beneficiaryForm = input.required<PaymentBeneficiaryFormGroup>();
  readonly beneficiaries = input.required<Beneficiary[]>();
  readonly paymentType = input<PaymentType | ''>('');
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly retry = output<void>();

  readonly isDomestic = computed(() => this.paymentType() === PaymentType.Domestic);
  readonly isInternational = computed(() => this.paymentType() === PaymentType.International);

  applyExisting(event: Event): void {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement) || !select.value) {
      return;
    }
    const selected = this.beneficiaries().find((beneficiary) => beneficiary.id === select.value);
    if (!selected) {
      return;
    }
    this.beneficiaryForm().patchValue({
      name: selected.name,
      account: selected.account,
      bankCode: selected.bankCode ?? '',
      swift: selected.swift ?? '',
      country: selected.country ?? '',
      address: selected.address ?? '',
    });
  }

  onModeChange(): void {
    if (this.beneficiaryForm().controls.mode.value !== 'new') {
      return;
    }
    this.beneficiaryForm().patchValue({
      existingId: '',
      name: '',
      account: '',
      bankCode: '',
      swift: '',
      country: '',
      address: '',
    });
  }
}
