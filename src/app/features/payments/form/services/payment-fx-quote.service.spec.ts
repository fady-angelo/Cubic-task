import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { FxQuoteRequest } from '../../models/fx-quote.models';
import { PaymentFxQuoteService } from './payment-fx-quote.service';

describe('PaymentFxQuoteService', () => {
  let fxQuotes: PaymentFxQuoteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PaymentFxQuoteService],
    });
    fxQuotes = TestBed.inject(PaymentFxQuoteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('POSTs a quote and exposes the response', () => {
    fxQuotes.sync(gbpToEur(10));

    http.expectOne(`${environment.baseUrl}/fx/quote`).flush(quoteBody('fx-1', 10));
    expect(fxQuotes.quote()?.quoteId).toBe('fx-1');
    expect(fxQuotes.quoteLoading()).toBe(false);
    expect(fxQuotes.quoteError()).toBeNull();
    expect(fxQuotes.quoteExpired()).toBe(false);
  });

  it('does not request a quote when currencies match', () => {
    fxQuotes.sync({
      debitAccountId: 'acc-4412',
      sourceCurrency: 'GBP',
      targetCurrency: 'GBP',
      targetAmount: 10,
    });
    http.expectNone(`${environment.baseUrl}/fx/quote`);
    expect(fxQuotes.quote()).toBeNull();
  });

  it('invalidates and requests again when amount changes', () => {
    fxQuotes.sync(gbpToEur(10));
    http.expectOne(`${environment.baseUrl}/fx/quote`).flush(quoteBody('fx-10', 10));

    fxQuotes.sync(gbpToEur(20));
    http.expectOne(`${environment.baseUrl}/fx/quote`).flush(quoteBody('fx-20', 20));
    expect(fxQuotes.quote()?.quoteId).toBe('fx-20');
  });

  it('lets only the latest overlapping quote response win', () => {
    fxQuotes.sync(gbpToEur(10));
    fxQuotes.sync(gbpToEur(25));

    const requests = http.match(`${environment.baseUrl}/fx/quote`);
    expect(requests.length).toBeGreaterThanOrEqual(1);
    const latest = requests[requests.length - 1];
    expect(latest.request.body.targetAmount).toBe(25);
    latest.flush(quoteBody('fx-latest', 25));
    for (const request of requests.slice(0, -1)) {
      if (!request.cancelled) {
        request.flush(quoteBody('fx-stale', 10));
      }
    }

    expect(fxQuotes.quote()?.quoteId).toBe('fx-latest');
  });

  it('marks a quote expired from expiresAt', () => {
    fxQuotes.sync(gbpToEur(10));
    http.expectOne(`${environment.baseUrl}/fx/quote`).flush({
      ...quoteBody('fx-expired', 10),
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    });
    expect(fxQuotes.quoteExpired()).toBe(true);
    expect(fxQuotes.remainingSeconds()).toBe(0);
  });

  it('retries the latest applicable request', () => {
    fxQuotes.sync(gbpToEur(10));
    http.expectOne(`${environment.baseUrl}/fx/quote`).flush({
      ...quoteBody('fx-expired', 10),
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    });

    fxQuotes.retry();
    http.expectOne(`${environment.baseUrl}/fx/quote`).flush(quoteBody('fx-retry', 10));
    expect(fxQuotes.quote()?.quoteId).toBe('fx-retry');
    expect(fxQuotes.quoteExpired()).toBe(false);
  });
});

function gbpToEur(targetAmount: number): FxQuoteRequest {
  return {
    debitAccountId: 'acc-4412',
    sourceCurrency: 'GBP',
    targetCurrency: 'EUR',
    targetAmount,
  };
}

function quoteBody(quoteId: string, targetAmount: number) {
  return {
    quoteId,
    sourceCurrency: 'GBP',
    targetCurrency: 'EUR',
    rate: 1.12,
    targetAmount,
    debitAmount: 11.2,
    expiresAt: new Date(Date.now() + 30_000).toISOString(),
  };
}
