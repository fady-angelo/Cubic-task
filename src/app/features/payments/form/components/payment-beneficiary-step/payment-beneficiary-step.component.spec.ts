import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
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
    name: new FormControl('', { nonNullable: true }),
    account: new FormControl('', { nonNullable: true }),
    bankCode: new FormControl('', { nonNullable: true }),
    swift: new FormControl('', { nonNullable: true }),
    country: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
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

  it('requires name and account for a domestic payment', () => {
    const form = fixture.componentInstance.beneficiaryForm.controls;
    expect(form.name.invalid).toBe(true);
    expect(form.account.invalid).toBe(true);
    form.name.markAsTouched();
    form.account.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enter a beneficiary name.');
    expect(fixture.nativeElement.textContent).toContain('Enter a beneficiary account.');

    form.name.setValue('Acme Supplies Ltd');
    form.account.setValue('GB12ACME000004412');
    fixture.detectChanges();
    expect(form.name.valid).toBe(true);
    expect(form.account.valid).toBe(true);
  });

  it('does not require SWIFT for a domestic payment and hides international fields', () => {
    const form = fixture.componentInstance.beneficiaryForm.controls;
    expect(form.swift.disabled).toBe(true);
    expect(form.swift.hasError('required')).toBe(false);
    expect(fixture.nativeElement.querySelector('#beneficiary-swift')).toBeNull();
    expect(fixture.nativeElement.querySelector('#beneficiary-country')).toBeNull();
    expect(fixture.nativeElement.querySelector('#beneficiary-address')).toBeNull();
    expect(fixture.nativeElement.querySelector('#beneficiary-bank-code')).toBeTruthy();
  });

  it('requires SWIFT, country, and address for an international payment', () => {
    fixture.componentInstance.paymentType.set(PaymentType.International);
    fixture.detectChanges();

    const form = fixture.componentInstance.beneficiaryForm.controls;
    expect(form.swift.enabled).toBe(true);
    expect(form.country.enabled).toBe(true);
    expect(form.address.enabled).toBe(true);
    expect(form.swift.invalid).toBe(true);
    expect(form.country.invalid).toBe(true);
    expect(form.address.invalid).toBe(true);
    expect(form.bankCode.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('#beneficiary-swift')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#beneficiary-bank-code')).toBeNull();

    form.swift.markAsTouched();
    form.country.markAsTouched();
    form.address.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enter a SWIFT/BIC code.');
    expect(fixture.nativeElement.textContent).toContain('Enter a country.');
    expect(fixture.nativeElement.textContent).toContain('Enter a beneficiary address.');

    form.swift.setValue('NDEANOKK');
    form.country.setValue('NO');
    form.address.setValue('Oslo Harbour 12');
    fixture.detectChanges();
    expect(form.swift.valid).toBe(true);
    expect(form.country.valid).toBe(true);
    expect(form.address.valid).toBe(true);
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
