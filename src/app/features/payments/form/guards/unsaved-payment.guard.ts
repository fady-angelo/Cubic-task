import { inject, Injectable, signal } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

export interface UnsavedPaymentHost {
  hasUnsavedChanges(): boolean;
}

@Injectable({ providedIn: 'root' })
export class UnsavedPaymentTracker {
  private host: UnsavedPaymentHost | null = null;
  private pendingLeave: ((leave: boolean) => void) | null = null;
  readonly leavePromptOpen = signal(false);

  setActiveForm(host: UnsavedPaymentHost | null): void {
    this.host = host;
  }

  hasUnsavedChanges(): boolean {
    return this.host?.hasUnsavedChanges() ?? false;
  }

  promptToLeave(): Promise<boolean> {
    this.pendingLeave?.(false);
    this.leavePromptOpen.set(true);
    return new Promise((resolve) => {
      this.pendingLeave = resolve;
    });
  }

  stayOnPage(): void {
    this.resolveLeave(false);
  }

  leaveWithoutSaving(): void {
    this.resolveLeave(true);
  }

  private resolveLeave(leave: boolean): void {
    this.leavePromptOpen.set(false);
    this.pendingLeave?.(leave);
    this.pendingLeave = null;
  }
}

export const unsavedPaymentGuard: CanDeactivateFn<UnsavedPaymentHost> = (component) => {
  const tracker = inject(UnsavedPaymentTracker);
  const unsaved = component?.hasUnsavedChanges() ?? tracker.hasUnsavedChanges();
  if (!unsaved) {
    return true;
  }
  return tracker.promptToLeave();
};
