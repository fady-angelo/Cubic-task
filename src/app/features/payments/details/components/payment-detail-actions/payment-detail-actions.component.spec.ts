import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PaymentDetailActionsComponent } from './payment-detail-actions.component';

describe('PaymentDetailActionsComponent', () => {
  let fixture: ComponentFixture<PaymentDetailActionsComponent>;
  let component: PaymentDetailActionsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentDetailActionsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PaymentDetailActionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('paymentId', 'pay-021');
    fixture.componentRef.setInput('canSubmit', true);
    fixture.detectChanges();
  });

  it('emits submit from the maker action', () => {
    const emit = vi.fn();
    component.action.subscribe(emit);
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (node) => (node as HTMLButtonElement).textContent?.trim() === 'Submit',
    ) as HTMLButtonElement;
    button.click();
    expect(emit).toHaveBeenCalledWith({ type: 'submit' });
  });
});
