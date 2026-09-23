import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PaymentType } from '../../../shared/enums/payment.enums';
import { Beneficiary } from '../../../models/beneficiary.models';
import { PaymentBeneficiaryFormGroup } from '../../models/payment-form.models';
import { PaymentBeneficiaryStepComponent } from './payment-beneficiary-step.component';

@Component({
  selector: 'app-payment-beneficiary-step-host',
  imports: [PaymentBeneficiaryStepComponent],
  template: `
    <app-payment-beneficiary-step
      [beneficiaryForm]="beneficiaryForm"
      [beneficiaries]="beneficiaries()"
      [paymentType]="paymentType()"
      [loading]="loading()"
      [errorMessage]="errorMessage()"
    />
  `,
})
class PaymentBeneficiaryStepHost {
  readonly paymentType = signal<PaymentType | ''>(PaymentType.Domestic);
  readonly beneficiaryForm: PaymentBeneficiaryFormGroup = new FormGroup({
    mode: new FormControl<'existing' | 'new'>('existing', { nonNullable: true }),
    existingId: new FormControl('', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    account: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    bankCode: new FormControl('', { nonNullable: true }),
    swift: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly beneficiaries = signal<Beneficiary[]>([acmeSupplies()]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
}

describe('PaymentBeneficiaryStepComponent', () => {
  let fixture: ComponentFixture<PaymentBeneficiaryStepHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentBeneficiaryStepHost],
    }).compileComponents();
    fixture = TestBed.createComponent(PaymentBeneficiaryStepHost);
    fixture.detectChanges();
  });

  it('fills name, account, and bank code when an existing beneficiary is selected', () => {
    const select = fixture.nativeElement.querySelector(
      '#existing-beneficiary',
    ) as HTMLSelectElement;
    select.value = 'ben-001';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const form = fixture.componentInstance.beneficiaryForm.controls;
    expect(form.existingId.value).toBe('ben-001');
    expect(form.name.value).toBe('Acme Supplies Ltd');
    expect(form.account.value).toBe('GB12ACME000004412');
    expect(form.bankCode.value).toBe('ACMEGB2L');
  });

  it('starts empty when switching to a new beneficiary', () => {
    const form = fixture.componentInstance.beneficiaryForm;
    form.patchValue({
      existingId: 'ben-001',
      name: 'Acme Supplies Ltd',
      account: 'GB12ACME000004412',
      bankCode: 'ACMEGB2L',
    });
    fixture.detectChanges();

    const newRadio = [...fixture.nativeElement.querySelectorAll('input[type="radio"]')].find(
      (input: HTMLInputElement) => input.value === 'new',
    ) as HTMLInputElement;
    newRadio.click();
    newRadio.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(form.controls.mode.value).toBe('new');
    expect(form.controls.existingId.value).toBe('');
    expect(form.controls.name.value).toBe('');
    expect(form.controls.account.value).toBe('');
    expect(form.controls.bankCode.value).toBe('');
  });

  it('shows name and account errors when those fields are touched and empty', () => {
    const form = fixture.componentInstance.beneficiaryForm.controls;
    form.name.markAsTouched();
    form.account.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enter a beneficiary name.');
    expect(fixture.nativeElement.textContent).toContain('Enter a beneficiary account.');
  });

  it('hides international fields for a domestic payment', () => {
    expect(fixture.nativeElement.querySelector('#beneficiary-swift')).toBeNull();
    expect(fixture.nativeElement.querySelector('#beneficiary-country')).toBeNull();
    expect(fixture.nativeElement.querySelector('#beneficiary-address')).toBeNull();
    expect(fixture.nativeElement.querySelector('#beneficiary-bank-code')).toBeTruthy();
  });

  it('shows SWIFT, country, and address for an international payment', () => {
    fixture.componentInstance.paymentType.set(PaymentType.International);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#beneficiary-swift')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#beneficiary-country')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#beneficiary-address')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#beneficiary-bank-code')).toBeNull();
  });
});

function acmeSupplies(): Beneficiary {
  return {
    id: 'ben-001',
    name: 'Acme Supplies Ltd',
    account: 'GB12ACME000004412',
    type: PaymentType.Domestic,
    bankCode: 'ACMEGB2L',
  };
}
