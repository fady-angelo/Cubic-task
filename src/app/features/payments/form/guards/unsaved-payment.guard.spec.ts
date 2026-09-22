import { TestBed } from '@angular/core/testing';
import { unsavedPaymentGuard, UnsavedPaymentTracker } from './unsaved-payment.guard';

describe('unsavedPaymentGuard', () => {
  it('allows leaving when the form is pristine', () => {
    const result = TestBed.runInInjectionContext(() =>
      unsavedPaymentGuard({ hasUnsavedChanges: () => false }, undefined!, undefined!, undefined!),
    );
    expect(result).toBe(true);
  });

  it('opens a leave prompt for a dirty form and waits for the choice', async () => {
    TestBed.configureTestingModule({ providers: [UnsavedPaymentTracker] });
    const tracker = TestBed.inject(UnsavedPaymentTracker);

    const blocked = TestBed.runInInjectionContext(() =>
      unsavedPaymentGuard({ hasUnsavedChanges: () => true }, undefined!, undefined!, undefined!),
    );
    expect(blocked).toBeInstanceOf(Promise);
    expect(tracker.leavePromptOpen()).toBe(true);

    tracker.stayOnPage();
    await expect(blocked).resolves.toBe(false);
    expect(tracker.leavePromptOpen()).toBe(false);
  });

  it('lets the user leave without saving after confirming', async () => {
    TestBed.configureTestingModule({ providers: [UnsavedPaymentTracker] });
    const tracker = TestBed.inject(UnsavedPaymentTracker);

    const allowed = TestBed.runInInjectionContext(() =>
      unsavedPaymentGuard({ hasUnsavedChanges: () => true }, undefined!, undefined!, undefined!),
    );
    tracker.leaveWithoutSaving();
    await expect(allowed).resolves.toBe(true);
  });

  it('still prompts when the router does not pass the component instance', async () => {
    TestBed.configureTestingModule({ providers: [UnsavedPaymentTracker] });
    const tracker = TestBed.inject(UnsavedPaymentTracker);
    tracker.setActiveForm({ hasUnsavedChanges: () => true });

    const blocked = TestBed.runInInjectionContext(() =>
      unsavedPaymentGuard(null!, undefined!, undefined!, undefined!),
    );
    tracker.stayOnPage();
    await expect(blocked).resolves.toBe(false);
  });
});
