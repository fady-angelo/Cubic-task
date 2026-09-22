import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { isAppHttpError } from '../../../../../core/errors/app-http-error';
import { messageFromError } from '../../../../../core/errors/message-from-error';
import { HttpResourceReloadService } from '../../../../../core/http/http-resource-reload.service';
import {
  canCancelOwnDraft,
  canEditDraftOrReturned,
  canReturnOrRejectPayment,
  canSubmitPayment,
  canViewFullAccount,
} from '../../../../../core/session/session-permissions';
import { SessionQueryService } from '../../../../../core/session/session-query.service';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { StatusBadgePipe } from '../../../shared/pipes/status-badge.pipe';
import { PaymentCommandPayload, PaymentDecision } from '../../../models/payment-command.models';
import { PaymentCommandService } from '../../../services/payment-command.service';
import { PaymentQueryService } from '../../../services/payment-query.service';
import { displayedDebtorAccount } from '../../../shared/utils/payment-display';
import { PaymentAuditTimelineComponent } from '../../components/payment-audit-timeline/payment-audit-timeline.component';
import {
  PaymentDetailAction,
  PaymentDetailActionsComponent,
} from '../../components/payment-detail-actions/payment-detail-actions.component';

@Component({
  selector: 'app-payment-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    NgClass,
    RouterLink,
    StatusBadgePipe,
    ErrorStateComponent,
    PaymentAuditTimelineComponent,
    PaymentDetailActionsComponent,
  ],
  templateUrl: './payment-detail.component.html',
})
export class PaymentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentQuery = inject(PaymentQueryService);
  private readonly paymentCommands = inject(PaymentCommandService);
  private readonly sessionQuery = inject(SessionQueryService);
  private readonly httpResourceReload = inject(HttpResourceReloadService);

  private readonly paymentId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );
  private readonly paymentDetailResource = this.paymentQuery.getPaymentDetailResource(() =>
    this.paymentId(),
  );
  private readonly currentUser = computed(() => this.sessionQuery.user());

  readonly payment = computed(() => this.paymentDetailResource.value() ?? null);
  readonly loading = computed(() => this.paymentDetailResource.isLoading());
  readonly errorMessage = computed(() => messageFromError(this.paymentDetailResource.error()));
  readonly actionInProgress = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly staleNotice = signal(false);

  readonly canViewFull = computed(() => canViewFullAccount(this.currentUser()));
  readonly debtorDisplay = computed(() =>
    displayedDebtorAccount(this.payment()?.debtorAccount, this.canViewFull()),
  );
  readonly canEdit = computed(() =>
    canEditDraftOrReturned(this.currentUser(), this.payment()?.status.value),
  );
  readonly canSubmit = computed(() =>
    canSubmitPayment(this.currentUser(), this.payment()?.status.value),
  );
  readonly canCancel = computed(() =>
    canCancelOwnDraft(
      this.currentUser(),
      this.payment()?.status.value,
      this.payment()?.makerUserId,
    ),
  );
  readonly canDecide = computed(() =>
    canReturnOrRejectPayment(this.currentUser(), this.payment()?.status.value),
  );
  readonly selfApprovalBlocked = computed(() => {
    const payment = this.payment();
    const user = this.currentUser();
    return this.canDecide() && !!payment && !!user && payment.makerUserId === user.userId;
  });

  retry(): void {
    this.httpResourceReload.reload(this.paymentDetailResource);
  }

  onPaymentAction(action: PaymentDetailAction): void {
    const payload = this.paymentCommandPayload();
    if (!payload) {
      return;
    }

    switch (action.type) {
      case 'submit':
        this.submitPayment(payload);
        return;
      case 'cancelDraft':
        this.cancelDraft(payload);
        return;
      case 'decide':
        this.decidePayment(payload, action.decision, action.reason);
        return;
    }
  }

  private submitPayment(payload: PaymentCommandPayload): void {
    this.trackPaymentCommand(this.paymentCommands.submit(payload.id, payload.body));
  }

  private cancelDraft(payload: PaymentCommandPayload): void {
    this.trackPaymentCommand(this.paymentCommands.cancelDraft(payload.id, payload.body));
  }

  private decidePayment(
    payload: PaymentCommandPayload,
    decision: PaymentDecision,
    reason?: string,
  ): void {
    if (decision === 'APPROVE' && this.selfApprovalBlocked()) {
      return;
    }
    this.trackPaymentCommand(
      this.paymentCommands.decide(payload.id, { ...payload.body, decision, reason }),
    );
  }

  private paymentCommandPayload(): PaymentCommandPayload | null {
    const payment = this.payment();
    if (!payment || this.actionInProgress()) {
      return null;
    }
    return {
      id: payment.id,
      body: {
        rowVersion: payment.rowVersion,
        clientRequestId: this.paymentCommands.newClientRequestId(),
      },
    };
  }

  private trackPaymentCommand(command: ReturnType<PaymentCommandService['submit']>): void {
    if (this.actionInProgress()) {
      return;
    }
    this.actionInProgress.set(true);
    this.actionError.set(null);
    this.staleNotice.set(false);
    command.pipe(finalize(() => this.actionInProgress.set(false))).subscribe({
      next: () => {
        this.httpResourceReload.reload(this.paymentDetailResource);
      },
      error: (error: unknown) => {
        if (isAppHttpError(error) && error.kind === 'conflict') {
          this.staleNotice.set(true);
          this.httpResourceReload.reload(this.paymentDetailResource);
          return;
        }
        this.actionError.set(messageFromError(error) ?? 'The action could not be completed.');
      },
    });
  }
}
