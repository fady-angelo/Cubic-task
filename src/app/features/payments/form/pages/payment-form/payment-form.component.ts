import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { FxQuoteRequest } from '../../../models/fx-quote.models';
import { isAppHttpError } from '../../../../../core/errors/app-http-error';
import { messageFromError } from '../../../../../core/errors/message-from-error';
import { HttpResourceReloadService } from '../../../../../core/http/http-resource-reload.service';
import {
  canEditDraftOrReturned,
  canViewFullAccount,
} from '../../../../../core/session/session-permissions';
import { SessionQueryService } from '../../../../../core/session/session-query.service';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { ReferenceDataService } from '../../../services/reference-data.service';
import { AccountQueryService } from '../../../services/account-query.service';
import { BeneficiaryQueryService } from '../../../services/beneficiary-query.service';
import { PaymentQueryService } from '../../../services/payment-query.service';
import { PaymentCommandService } from '../../../services/payment-command.service';
import { PaymentWriteResult } from '../../../models/payment-command.models';
import { PaymentDetail } from '../../../models/payment-detail.models';
import { toDebitAccountOptions } from '../../utils/to-debit-account-options';
import { toPaymentReviewSummary } from '../../utils/to-payment-review-summary';
import { toPaymentWriteRequest } from '../../utils/to-payment-write-request';
import { applyPaymentFieldErrors } from '../../utils/apply-payment-field-errors';
import { quoteRequestKey } from '../../services/payment-fx-quote.service';
import { PaymentForm } from '../../models/payment-form.models';
import {
  FIRST_PAYMENT_FORM_STEP,
  LAST_PAYMENT_FORM_STEP,
  PAYMENT_FORM_STEPS,
  PaymentFormStepId,
} from '../../payment-form.constants';
import { PaymentSourceStepComponent } from '../../components/payment-source-step/payment-source-step.component';
import { PaymentBeneficiaryStepComponent } from '../../components/payment-beneficiary-step/payment-beneficiary-step.component';
import { PaymentPaymentStepComponent } from '../../components/payment-payment-step/payment-payment-step.component';
import { PaymentReviewStepComponent } from '../../components/payment-review-step/payment-review-step.component';
import { todayDateInputValue } from '../../../../../shared/utils/date-input';
import { PaymentFormService } from '../../services/payment-form.service';
import { PaymentFxQuoteService } from '../../services/payment-fx-quote.service';
import { UnsavedPaymentTracker } from '../../guards/unsaved-payment.guard';

@Component({
  selector: 'app-payment-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PaymentSourceStepComponent,
    PaymentBeneficiaryStepComponent,
    PaymentPaymentStepComponent,
    PaymentReviewStepComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
  ],
  providers: [PaymentFxQuoteService],
  templateUrl: './payment-form.component.html',
})
export class PaymentFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly paymentFormService = inject(PaymentFormService);
  private readonly fxQuotes = inject(PaymentFxQuoteService);
  private readonly accountQuery = inject(AccountQueryService);
  private readonly beneficiaryQuery = inject(BeneficiaryQueryService);
  private readonly paymentQuery = inject(PaymentQueryService);
  private readonly paymentCommands = inject(PaymentCommandService);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly sessionQuery = inject(SessionQueryService);
  private readonly httpResourceReload = inject(HttpResourceReloadService);
  protected readonly unsavedTracker = inject(UnsavedPaymentTracker);

  private readonly paymentId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );
  protected readonly accountsResource = this.accountQuery.getAccountsResource();
  protected readonly beneficiariesResource = this.beneficiaryQuery.getBeneficiariesResource();
  private readonly referenceResource = this.referenceData.getReferenceDataResource();
  protected readonly paymentResource = this.paymentQuery.getPaymentDetailResource(
    () => this.paymentId() ?? '',
  );

  readonly referenceResourceValue = computed(() => this.referenceResource.value());
  readonly form: PaymentForm = this.paymentFormService.createForm(
    (currencyCode) => this.minorUnitsFor(currencyCode),
    this.destroyRef,
  );
  readonly paymentType = toSignal(this.form.controls.source.controls.type.valueChanges, {
    initialValue: this.form.controls.source.controls.type.value,
  });
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });
  readonly isFormValid = computed(() => this.formStatus() === 'VALID');
  readonly reviewSummary = computed(() => {
    this.formValue();
    return toPaymentReviewSummary(
      this.form,
      this.debitAccounts(),
      this.referenceResourceValue()?.paymentTypes,
    );
  });
  readonly steps = PAYMENT_FORM_STEPS;
  readonly currentStep = signal<PaymentFormStepId>(FIRST_PAYMENT_FORM_STEP);
  readonly stepStates = computed(() =>
    this.steps.map((step) => ({
      ...step,
      isCurrent: step.id === this.currentStep(),
      isDone: step.id < this.currentStep(),
      isClickable: step.id < this.currentStep(),
    })),
  );
  readonly isEdit = computed(() => Boolean(this.paymentId()));
  readonly heading = computed(() => (this.isEdit() ? 'Edit payment' : 'New payment'));
  readonly currentStepLabel = computed(() => {
    const matchingStep = this.steps.find((step) => step.id === this.currentStep());
    return matchingStep?.label;
  });
  readonly canGoBack = computed(() => this.currentStep() > FIRST_PAYMENT_FORM_STEP);
  readonly canGoNext = computed(() => this.currentStep() < LAST_PAYMENT_FORM_STEP);
  readonly fxQuoteRequest = computed((): FxQuoteRequest | null => this.toFxQuoteRequest());
  readonly requiresFxQuote = computed(() => {
    const request = this.fxQuoteRequest();
    return !!request && request.sourceCurrency !== request.targetCurrency;
  });
  readonly quote = this.fxQuotes.quote;
  readonly quoteLoading = this.fxQuotes.quoteLoading;
  readonly quoteError = this.fxQuotes.quoteError;
  readonly quoteExpired = this.fxQuotes.quoteExpired;
  readonly remainingSeconds = this.fxQuotes.remainingSeconds;
  readonly mutationInProgress = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly staleNotice = signal(false);
  readonly canSaveDraft = computed(
    () => this.isFormValid() && !this.mutationInProgress() && this.canWritePayment(),
  );
  readonly canSubmit = computed(
    () => this.canConfirmPayment() && !this.mutationInProgress() && this.canWritePayment(),
  );
  readonly accountsLoading = computed(() => this.accountsResource.isLoading());
  readonly accountsError = computed(() => messageFromError(this.accountsResource.error()));
  readonly debitAccounts = computed(() =>
    toDebitAccountOptions(
      this.accountsResource.value()?.items,
      canViewFullAccount(this.sessionQuery.user()),
    ),
  );
  readonly beneficiariesLoading = computed(() => this.beneficiariesResource.isLoading());
  readonly beneficiariesError = computed(() =>
    messageFromError(this.beneficiariesResource.error()),
  );
  readonly beneficiaries = computed(() => this.beneficiariesResource.value()?.items ?? []);
  readonly minExecutionDate = todayDateInputValue();
  readonly payment = computed(() => this.paymentResource.value() ?? null);
  readonly paymentLoading = computed(() => this.isEdit() && this.paymentResource.isLoading());
  readonly paymentError = computed(() =>
    this.isEdit() ? messageFromError(this.paymentResource.error()) : null,
  );
  readonly editBlocked = computed(() => {
    const payment = this.payment();
    return (
      this.isEdit() &&
      !!payment &&
      !canEditDraftOrReturned(this.sessionQuery.user(), payment.status.value)
    );
  });

  private lastWrite: PaymentWriteResult | null = null;
  private rowVersionOverride: number | undefined;
  private hydratedKey: string | null = null;
  private hydratedFxQuoteId: string | undefined;
  private hydratedFxQuoteKey = '';
  private readonly loadPaymentIntoForm = effect(() => {
    const isLoading = this.paymentResource.isLoading();
    const payment = this.paymentResource.value();
    const error = this.paymentResource.error();

    if (isLoading || error || !payment || this.editBlocked()) {
      return;
    }

    const hydrateKey = `${payment.id}:${payment.rowVersion}`;
    if (this.hydratedKey === hydrateKey) {
      return;
    }
    this.applyPaymentDetail(payment);
    this.hydratedKey = hydrateKey;
  });

  private readonly bindFxQuote = effect(() => {
    this.fxQuotes.sync(this.fxQuoteRequest());
  });

  ngOnInit(): void {
    this.unsavedTracker.setActiveForm(this);
    this.destroyRef.onDestroy(() => {
      this.unsavedTracker.stayOnPage();
      this.unsavedTracker.setActiveForm(null);
    });
  }

  goNext(): void {
    if (!this.canGoNext()) {
      return;
    }
    this.currentStep.update((step) => (step + 1) as PaymentFormStepId);
  }

  goBack(): void {
    if (!this.canGoBack()) {
      return;
    }
    this.currentStep.update((step) => (step - 1) as PaymentFormStepId);
  }

  goToStep(step: PaymentFormStepId): void {
    if (step < FIRST_PAYMENT_FORM_STEP || step > this.currentStep()) {
      return;
    }
    this.currentStep.set(step);
  }

  stepDescription(step: PaymentFormStepId): string {
    switch (step) {
      case 1:
        return 'Choose the debit account, payment type, and execution date.';
      case 2:
        return 'Pick a saved beneficiary or enter a new one. Required fields depend on the type.';
      case 3:
        return 'Enter the amount, currency, purpose, remittance, and charge option.';
      case 4:
        return 'Review the details and the FX quote before saving or submitting.';
    }
  }

  saveDraft(): void {
    if (!this.canSaveDraft()) {
      return;
    }
    this.runMutation(this.persist(this.paymentCommands.newClientRequestId()), 'queue');
  }

  submitPayment(): void {
    if (!this.canSubmit()) {
      return;
    }
    const writeRequestId = this.paymentCommands.newClientRequestId();
    const submitRequestId = this.paymentCommands.newClientRequestId();
    this.runMutation(
      this.persist(writeRequestId).pipe(
        switchMap((result) =>
          this.paymentCommands.submit(result.id, {
            rowVersion: result.rowVersion,
            clientRequestId: submitRequestId,
          }),
        ),
      ),
      'detail',
    );
  }

  retryQuote(): void {
    this.fxQuotes.retry();
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  private canWritePayment(): boolean {
    return !this.editBlocked();
  }

  private canConfirmPayment(): boolean {
    if (this.currentStep() !== LAST_PAYMENT_FORM_STEP || !this.isFormValid()) {
      return false;
    }
    if (this.quoteLoading() || this.quoteError()) {
      return false;
    }
    if (!this.requiresFxQuote()) {
      return true;
    }
    return !!this.quote() && !this.quoteExpired();
  }

  private persist(clientRequestId: string): Observable<PaymentWriteResult> {
    const id = this.persistedPaymentId();
    const rowVersion = id ? this.currentRowVersion() : undefined;
    const body = toPaymentWriteRequest(this.form, clientRequestId, {
      rowVersion,
      fxQuoteId: this.activeFxQuoteId(),
    });
    if (id && rowVersion != null) {
      return this.paymentCommands.update(id, body);
    }
    return this.paymentCommands.create(body);
  }

  private runMutation(
    command: Observable<PaymentWriteResult>,
    afterSuccess: 'queue' | 'detail',
  ): void {
    if (this.mutationInProgress()) {
      return;
    }
    this.mutationInProgress.set(true);
    this.actionError.set(null);
    this.staleNotice.set(false);
    command
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.mutationInProgress.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.lastWrite = result;
          this.rowVersionOverride = undefined;
          this.form.markAsPristine();
          if (afterSuccess === 'queue') {
            void this.router.navigate(['/payments']);
            return;
          }
          void this.router.navigate(['/payments', result.id]);
        },
        error: (error: unknown) => this.onMutationError(error),
      });
  }

  private onMutationError(error: unknown): void {
    if (isAppHttpError(error) && error.kind === 'conflict') {
      this.staleNotice.set(true);
      this.rowVersionOverride = error.apiError?.currentRowVersion;
      if (this.paymentId()) {
        this.httpResourceReload.reload(this.paymentResource);
      }
      return;
    }
    if (isAppHttpError(error) && error.kind === 'validation') {
      applyPaymentFieldErrors(this.form, error.apiError?.fieldErrors);
    }
    this.actionError.set(messageFromError(error) ?? 'The payment could not be saved.');
  }

  private persistedPaymentId(): string | null {
    return this.paymentId() || this.lastWrite?.id || null;
  }

  private currentRowVersion(): number | undefined {
    return this.rowVersionOverride ?? this.payment()?.rowVersion ?? this.lastWrite?.rowVersion;
  }

  private toFxQuoteRequest(): FxQuoteRequest | null {
    this.formValue();
    const debitAccountId = this.form.controls.source.controls.debitAccountId.value;
    const targetAmount = this.form.controls.payment.controls.amount.value;
    const targetCurrency = this.form.controls.payment.controls.currency.value;
    const sourceCurrency = this.accountsResource
      .value()
      ?.items.find((account) => account.id === debitAccountId)?.currency;
    if (!debitAccountId || targetAmount == null || !targetCurrency || !sourceCurrency) {
      return null;
    }
    return { debitAccountId, sourceCurrency, targetCurrency, targetAmount };
  }

  private applyPaymentDetail(payment: PaymentDetail): void {
    this.paymentFormService.applyDetail(this.form, payment);
    this.hydratedFxQuoteId = payment.fxQuoteId;
    const quoteRequest = this.toFxQuoteRequest();
    this.hydratedFxQuoteKey = quoteRequest ? quoteRequestKey(quoteRequest) : '';
  }

  private activeFxQuoteId(): string | undefined {
    const liveQuoteId = this.quote()?.quoteId;
    if (liveQuoteId) {
      return liveQuoteId;
    }
    const request = this.toFxQuoteRequest();
    if (!request || quoteRequestKey(request) !== this.hydratedFxQuoteKey) {
      return undefined;
    }
    return this.hydratedFxQuoteId;
  }

  private minorUnitsFor(currencyCode: string): number | undefined {
    return this.referenceResourceValue()?.currencies?.find(
      (currency) => currency.code === currencyCode,
    )?.minorUnits;
  }
}
