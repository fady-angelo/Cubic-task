import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('title', 'Leave without saving?');
    fixture.componentRef.setInput('message', 'Unsaved payment details will be lost.');
    fixture.detectChanges();
  });

  it('shows copy and emits confirm or cancel', () => {
    const confirmed = vi.fn();
    const cancelled = vi.fn();
    fixture.componentInstance.confirm.subscribe(confirmed);
    fixture.componentInstance.cancel.subscribe(cancelled);
    expect(fixture.nativeElement.textContent).toContain('Leave without saving?');
    expect(fixture.nativeElement.textContent).toContain('Unsaved payment details will be lost.');

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[buttons.length - 1].click();
    expect(confirmed).toHaveBeenCalled();

    buttons[1].click();
    expect(cancelled).toHaveBeenCalled();
  });
});
