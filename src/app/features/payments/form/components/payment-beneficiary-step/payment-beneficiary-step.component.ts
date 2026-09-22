import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, Validators } from '@angular/forms';
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

  private readonly applyPaymentTypeRules = effect(() => {
    this.syncBeneficiaryTypeRules(
      this.beneficiaryForm(),
      this.isDomestic(),
      this.isInternational(),
    );
  });

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

  private syncBeneficiaryTypeRules(
    group: PaymentBeneficiaryFormGroup,
    isDomestic: boolean,
    isInternational: boolean,
  ): void {
    setRequired(group.controls.name, isDomestic || isInternational);
    setRequired(group.controls.account, isDomestic || isInternational);
    setRequired(group.controls.swift, isInternational);
    setRequired(group.controls.country, isInternational);
    setRequired(group.controls.address, isInternational);
    setEnabled(group.controls.bankCode, isDomestic);
    setEnabled(group.controls.swift, isInternational);
    setEnabled(group.controls.country, isInternational);
    setEnabled(group.controls.address, isInternational);
  }
}

function setRequired(control: AbstractControl, required: boolean): void {
  if (required) {
    control.setValidators(Validators.required);
  } else {
    control.clearValidators();
  }
  control.updateValueAndValidity({ emitEvent: false });
}

function setEnabled(control: AbstractControl, enabled: boolean): void {
  if (enabled) {
    control.enable({ emitEvent: false });
  } else {
    control.disable({ emitEvent: false });
  }
}
