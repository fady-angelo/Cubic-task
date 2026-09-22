import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PaymentType } from '../../../shared/enums/payment.enums';
import { PaymentSourceFormGroup } from '../../models/payment-form.models';
import { notPastDateValidator } from '../../validators/not-in-the-past.validator';
import { PaymentSourceStepComponent } from './payment-source-step.component';

@Component({
  selector: 'app-payment-source-step-host',
  imports: [PaymentSourceStepComponent],
  template: `
    <app-payment-source-step
      [sourceForm]="sourceForm"
      [accounts]="accounts()"
      [paymentTypes]="paymentTypes()"
      [minExecutionDate]="minExecutionDate"
      [loading]="loading()"
      [errorMessage]="errorMessage()"
    />
  `,
})
class PaymentSourceStepHost {
  readonly minExecutionDate = '2026-09-22';
  readonly sourceForm: PaymentSourceFormGroup = new FormGroup({
    debitAccountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<PaymentType | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    executionDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, notPastDateValidator],
    }),
  });
  readonly accounts = signal([{ id: 'acc-4412', label: '**** **** **** 4412 · GBP' }]);
  readonly paymentTypes = signal([
    { value: PaymentType.Domestic, label: 'Domestic' },
    { value: PaymentType.International, label: 'International' },
  ]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
}

describe('PaymentSourceStepComponent', () => {
  let fixture: ComponentFixture<PaymentSourceStepHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentSourceStepHost],
    }).compileComponents();
    fixture = TestBed.createComponent(PaymentSourceStepHost);
    fixture.detectChanges();
  });

  it('lists debit accounts in the select', () => {
    const select = fixture.nativeElement.querySelector('#debit-account') as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.textContent).toContain('**** **** **** 4412 · GBP');
    expect(
      fixture.nativeElement.querySelector('label[for="debit-account"]').classList.contains(
        'is-required',
      ),
    ).toBe(true);
  });

  it('lists payment types from reference data', () => {
    const select = fixture.nativeElement.querySelector('#payment-type') as HTMLSelectElement;
    expect(select.textContent).toContain('Domestic');
    expect(select.textContent).toContain('International');
  });

  it('marks debit account required when empty and touched', () => {
    const control = fixture.componentInstance.sourceForm.controls.debitAccountId;
    expect(control.invalid).toBe(true);
    control.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Select a debit account.');
  });

  it('marks payment type required when empty and touched', () => {
    const control = fixture.componentInstance.sourceForm.controls.type;
    expect(control.invalid).toBe(true);
    control.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Select a payment type.');
  });

  it('shows a past-date error when execution date is before today', () => {
    const control = fixture.componentInstance.sourceForm.controls.executionDate;
    control.setValue('2020-01-01');
    control.markAsTouched();
    fixture.detectChanges();
    expect(control.hasError('pastDate')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Execution date cannot be in the past.');
  });
});
