import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { messageFromError } from '../../../../core/errors/message-from-error';
import { FxQuote, FxQuoteRequest } from '../../models/fx-quote.models';
import { FxQuoteService } from '../../services/fx-quote.service';

@Injectable()
export class PaymentFxQuoteService {
  private readonly fxQuote = inject(FxQuoteService);

  private readonly quoteState = signal<FxQuote | null>(null);
  private readonly quoteLoadingState = signal(false);
  private readonly quoteErrorState = signal<string | null>(null);
  private readonly now = signal(Date.now());
  private lastQuoteKey = '';
  private readonly quoteRequests = new Subject<FxQuoteRequest | null>();
  private latestRequest: FxQuoteRequest | null = null;

  readonly quote = this.quoteState.asReadonly();
  readonly quoteLoading = this.quoteLoadingState.asReadonly();
  readonly quoteError = this.quoteErrorState.asReadonly();
  readonly quoteExpired = computed(() => {
    const quote = this.quoteState();
    return !!quote && Date.parse(quote.expiresAt) <= this.now();
  });
  readonly remainingSeconds = computed(() => {
    const quote = this.quoteState();
    if (!quote) {
      return 0;
    }
    return Math.max(0, Math.ceil((Date.parse(quote.expiresAt) - this.now()) / 1000));
  });

  private readonly quotes = this.quoteRequests
    .pipe(
      switchMap((request) => this.loadQuote(request)),
      takeUntilDestroyed(),
    )
    .subscribe((quote) => this.applyQuote(quote));

  private readonly tickQuoteExpiry = effect((onCleanup) => {
    if (!this.quoteState()) {
      return;
    }
    const id = setInterval(() => this.now.set(Date.now()), 1000);
    onCleanup(() => clearInterval(id));
  });

  sync(request: FxQuoteRequest | null): void {
    this.latestRequest = request;
    if (!request || request.sourceCurrency === request.targetCurrency) {
      this.lastQuoteKey = '';
      this.quoteRequests.next(null);
      return;
    }
    const key = quoteRequestKey(request);
    if (key === this.lastQuoteKey) {
      return;
    }
    this.lastQuoteKey = key;
    this.quoteRequests.next(request);
  }

  retry(): void {
    this.lastQuoteKey = '';
    this.quoteRequests.next(this.latestRequest);
  }

  private loadQuote(request: FxQuoteRequest | null) {
    this.quoteErrorState.set(null);
    if (!request || request.sourceCurrency === request.targetCurrency) {
      this.quoteLoadingState.set(false);
      return of(null);
    }
    this.quoteLoadingState.set(true);
    return this.fxQuote.getQuote(request).pipe(
      catchError((error: unknown) => {
        this.quoteErrorState.set(messageFromError(error));
        this.quoteLoadingState.set(false);
        return of(null);
      }),
    );
  }

  private applyQuote(quote: FxQuote | null): void {
    this.quoteLoadingState.set(false);
    this.quoteState.set(quote);
    this.now.set(Date.now());
  }
}

export function quoteRequestKey(request: FxQuoteRequest): string {
  return `${request.debitAccountId}|${request.sourceCurrency}|${request.targetCurrency}|${request.targetAmount}`;
}
