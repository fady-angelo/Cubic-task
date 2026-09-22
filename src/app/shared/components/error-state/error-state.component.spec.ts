import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ErrorStateComponent);
    fixture.componentRef.setInput('message', 'Unavailable');
    fixture.detectChanges();
  });

  it('shows the message and emits retry', () => {
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    expect(fixture.nativeElement.textContent).toContain('Unavailable');
    fixture.nativeElement.querySelector('button')?.click();
    expect(retry).toHaveBeenCalled();
  });
});
