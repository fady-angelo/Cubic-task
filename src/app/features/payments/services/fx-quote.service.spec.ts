import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { FxQuoteService } from './fx-quote.service';

describe('FxQuoteService', () => {
  let fx: FxQuoteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fx = TestBed.inject(FxQuoteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('POSTs the quote request to /api/fx/quote', () => {
    const request = {
      debitAccountId: 'acc-4412',
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      targetAmount: 10,
    };
    fx.getQuote(request).subscribe();

    const httpRequest = http.expectOne(`${environment.baseUrl}/fx/quote`);
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);
    httpRequest.flush({
      quoteId: 'fx-1',
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      rate: 1.12,
      targetAmount: 10,
      debitAmount: 11.2,
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    });
  });
});
