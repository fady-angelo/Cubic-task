import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { PaymentDetail } from '../../models/payment-detail.models';
import { PaymentType } from '../../shared/enums/payment.enums';
import { BeneficiaryMode, PaymentForm } from '../models/payment-form.models';
import { toPaymentFormValue } from '../utils/to-payment-form-value';
import { currencyPrecisionValidator } from '../validators/currency-precision.validator';
import { notPastDateValidator } from '../validators/not-in-the-past.validator';
import { positiveAmountValidator } from '../validators/positive-amount.validator';

@Injectable({ providedIn: 'root' })
export class PaymentFormService {
  private readonly formBuilder = inject(FormBuilder);

  createForm(
    minorUnitsFor: (currencyCode: string) => number | undefined,
    destroyRef: DestroyRef,
  ): PaymentForm {
    const form = this.formBuilder.nonNullable.group({
      source: this.formBuilder.nonNullable.group({
        debitAccountId: ['', Validators.required],
        type: this.formBuilder.nonNullable.control<PaymentType | ''>('', {
          validators: [Validators.required],
        }),
        executionDate: ['', [Validators.required, notPastDateValidator]],
      }),
      beneficiary: this.formBuilder.nonNullable.group({
        mode: this.formBuilder.nonNullable.control<BeneficiaryMode>('existing'),
        existingId: [''],
        name: [''],
        account: [''],
        bankCode: [''],
        swift: [''],
        country: [''],
        address: [''],
      }),
      payment: this.formBuilder.group({
        amount: this.formBuilder.control<number | null>(null),
        currency: this.formBuilder.nonNullable.control('', {
          validators: [Validators.required],
        }),
        purposeCode: this.formBuilder.nonNullable.control('', {
          validators: [Validators.required],
        }),
        remittanceInformation: this.formBuilder.nonNullable.control('', {
          validators: [Validators.required],
        }),
        chargeOption: this.formBuilder.nonNullable.control(''),
      }),
    });
    form.controls.payment.controls.amount.setValidators([
      Validators.required,
      positiveAmountValidator,
      currencyPrecisionValidator(() =>
        minorUnitsFor(form.controls.payment.controls.currency.value),
      ),
    ]);
    this.bindTypeRules(form, destroyRef);
    this.bindCurrencyPrecision(form, destroyRef);
    this.applyTypeRules(form, form.controls.source.controls.type.value);
    return form;
  }

  applyDetail(form: PaymentForm, payment: PaymentDetail): void {
    const value = toPaymentFormValue(payment);
    this.applyTypeRules(form, value.source.type);
    form.patchValue(value);
    form.updateValueAndValidity();
    form.markAsPristine();
  }

  private bindTypeRules(form: PaymentForm, destroyRef: DestroyRef): void {
    form.controls.source.controls.type.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((type) => this.applyTypeRules(form, type));
  }

  private bindCurrencyPrecision(form: PaymentForm, destroyRef: DestroyRef): void {
    form.controls.payment.controls.currency.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        form.controls.payment.controls.amount.updateValueAndValidity();
      });
  }

  private applyTypeRules(form: PaymentForm, type: PaymentType | ''): void {
    this.clearInapplicableFields(form, type);
    this.syncChargeOption(form, type);
    this.syncBeneficiaryFields(form, type);
  }

  private syncChargeOption(form: PaymentForm, type: PaymentType | ''): void {
    const charge = form.controls.payment.controls.chargeOption;
    if (type === PaymentType.International) {
      charge.enable({ emitEvent: false });
      charge.setValidators(Validators.required);
    } else {
      charge.clearValidators();
      charge.disable({ emitEvent: false });
    }
    charge.updateValueAndValidity({ emitEvent: false });
  }

  private syncBeneficiaryFields(form: PaymentForm, type: PaymentType | ''): void {
    const beneficiary = form.controls.beneficiary.controls;
    const isDomestic = type === PaymentType.Domestic;
    const isInternational = type === PaymentType.International;

    const hasType = isDomestic || isInternational;
    setRequired(beneficiary.name, hasType);
    setRequired(beneficiary.account, hasType);
    setEnabled(beneficiary.bankCode, isDomestic);
    setEnabled(beneficiary.swift, isInternational);
    setEnabled(beneficiary.country, isInternational);
    setEnabled(beneficiary.address, isInternational);
    setRequired(beneficiary.swift, isInternational);
    setRequired(beneficiary.country, isInternational);
    setRequired(beneficiary.address, isInternational);
  }

  private clearInapplicableFields(form: PaymentForm, type: PaymentType | ''): void {
    const beneficiary = form.controls.beneficiary.controls;
    if (type === PaymentType.Domestic) {
      beneficiary.swift.setValue('', { emitEvent: false });
      beneficiary.country.setValue('', { emitEvent: false });
      beneficiary.address.setValue('', { emitEvent: false });
      form.controls.payment.controls.chargeOption.setValue('', { emitEvent: false });
      return;
    }
    if (type === PaymentType.International) {
      beneficiary.bankCode.setValue('', { emitEvent: false });
    }
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
