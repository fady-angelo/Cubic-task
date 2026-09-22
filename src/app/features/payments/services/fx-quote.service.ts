import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FxQuote, FxQuoteRequest } from '../models/fx-quote.models';

@Injectable({ providedIn: 'root' })
export class FxQuoteService {
  private readonly http = inject(HttpClient);

  getQuote(request: FxQuoteRequest): Observable<FxQuote> {
    return this.http.post<FxQuote>(`${environment.baseUrl}/fx/quote`, request);
  }
}
