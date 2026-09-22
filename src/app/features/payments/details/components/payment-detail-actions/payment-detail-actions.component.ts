import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaymentDecision } from '../../../models/payment-command.models';

export type PaymentDetailPrompt = 'approve' | 'return' | 'reject';

export type PaymentDetailAction =
  | { type: 'submit' }
  | { type: 'cancelDraft' }
  | { type: 'decide'; decision: PaymentDecision; reason?: string };

@Component({
  selector: 'app-payment-detail-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './payment-detail-actions.component.html',
})
export class PaymentDetailActionsComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly paymentId = input.required<string>();
  readonly busy = input(false);
  readonly canEdit = input(false);
  readonly canSubmit = input(false);
  readonly canCancel = input(false);
  readonly canDecide = input(false);
  readonly selfApprovalBlocked = input(false);

  readonly action = output<PaymentDetailAction>();

  readonly pendingPrompt = signal<PaymentDetailPrompt | null>(null);
  readonly reasonPrompt = computed(() => {
    const prompt = this.pendingPrompt();
    return prompt === 'return' || prompt === 'reject' ? prompt : null;
  });
  readonly hasMakerActions = computed(() => this.canEdit() || this.canSubmit() || this.canCancel());
  readonly reasonForm = this.formBuilder.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3)]],
  });

  openPrompt(prompt: PaymentDetailPrompt): void {
    this.reasonForm.reset();
    this.pendingPrompt.set(prompt);
  }

  closePrompt(): void {
    this.pendingPrompt.set(null);
  }

  confirmApprove(): void {
    this.pendingPrompt.set(null);
    this.action.emit({ type: 'decide', decision: 'APPROVE' });
  }

  confirmReason(): void {
    if (this.reasonForm.invalid) {
      this.reasonForm.markAllAsTouched();
      return;
    }
    const prompt = this.pendingPrompt();
    if (prompt !== 'return' && prompt !== 'reject') {
      return;
    }
    const reason = this.reasonForm.controls.reason.value.trim();
    this.pendingPrompt.set(null);
    this.action.emit({
      type: 'decide',
      decision: prompt === 'return' ? 'RETURN' : 'REJECT',
      reason,
    });
  }
}
