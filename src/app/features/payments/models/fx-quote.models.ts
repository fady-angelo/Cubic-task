export interface FxQuoteRequest {
  debitAccountId: string;
  sourceCurrency: string;
  targetCurrency: string;
  targetAmount: number;
}

export interface FxQuote {
  quoteId: string;
  sourceCurrency: string;
  targetCurrency: string;
  rate: number;
  targetAmount: number;
  debitAmount: number;
  expiresAt: string;
}
