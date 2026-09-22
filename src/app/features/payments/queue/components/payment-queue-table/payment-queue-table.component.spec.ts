import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PaymentStatus, PaymentType } from '../../../shared/enums/payment.enums';
import { PAYMENT_LIST_COLUMNS } from '../../payment-list.constants';
import { PaymentQueueTableComponent } from './payment-queue-table.component';

describe('PaymentQueueTableComponent', () => {
  let fixture: ComponentFixture<PaymentQueueTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentQueueTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PaymentQueueTableComponent);
    fixture.componentRef.setInput('payments', [
      {
        id: 'pay-1',
        reference: 'PAY-1',
        type: { value: PaymentType.Domestic, label: 'Domestic' },
        status: { value: PaymentStatus.Draft, label: 'Draft' },
        debtorAccountMasked: '**** 12',
        beneficiaryName: 'Acme',
        currency: 'GBP',
        amount: 10,
        makerUserId: 'u1',
        makerName: 'Sara',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
        rowVersion: 1,
      },
    ]);
    fixture.componentRef.setInput('columns', PAYMENT_LIST_COLUMNS);
    fixture.componentRef.setInput('sortField', 'createdAt');
    fixture.detectChanges();
  });

  it('emits openPayment when a row is clicked', () => {
    const openPayment = vi.fn();
    fixture.componentInstance.openPayment.subscribe(openPayment);
    fixture.nativeElement.querySelector('tbody tr')?.click();
    expect(openPayment).toHaveBeenCalledWith('pay-1');
  });
});
