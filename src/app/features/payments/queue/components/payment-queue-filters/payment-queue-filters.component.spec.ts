import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PaymentStatus } from '../../../shared/enums/payment.enums';
import {
  PaymentQueueFilterForm,
  PaymentQueueFiltersComponent,
} from './payment-queue-filters.component';

@Component({
  selector: 'app-payment-queue-filters-host',
  imports: [PaymentQueueFiltersComponent, ReactiveFormsModule],
  template: `
    <app-payment-queue-filters
      [form]="form"
      [statusOptions]="statusOptions"
      [typeOptions]="typeOptions"
      [hasValues]="true"
    />
  `,
})
class FiltersHostComponent {
  readonly form: PaymentQueueFilterForm = new FormBuilder().nonNullable.group({
    search: [''],
    status: [''],
    type: [''],
    currency: [''],
    dateFrom: [''],
    dateTo: [''],
  });
  readonly statusOptions = [{ value: PaymentStatus.Draft, label: 'Draft' }];
  readonly typeOptions = [{ value: 'DOMESTIC', label: 'Domestic' }];
}

describe('PaymentQueueFiltersComponent', () => {
  let fixture: ComponentFixture<FiltersHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltersHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FiltersHostComponent);
    fixture.detectChanges();
  });

  it('clears all filter controls', () => {
    const host = fixture.componentInstance;
    host.form.patchValue({ search: 'acme', status: PaymentStatus.Draft });
    fixture.detectChanges();
    const clear = [...fixture.nativeElement.querySelectorAll('button')].find((button) =>
      (button.textContent ?? '').includes('Clear filters'),
    );
    clear?.click();
    fixture.detectChanges();
    expect(host.form.getRawValue()).toEqual({
      search: '',
      status: '',
      type: '',
      currency: '',
      dateFrom: '',
      dateTo: '',
    });
  });
});
