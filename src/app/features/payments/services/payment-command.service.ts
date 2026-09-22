import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PaymentActionRequest,
  PaymentDecisionRequest,
  PaymentWriteRequest,
  PaymentWriteResult,
} from '../models/payment-command.models';

@Injectable({ providedIn: 'root' })
export class PaymentCommandService {
  private readonly http = inject(HttpClient);

  newClientRequestId(): string {
    return crypto.randomUUID();
  }

  create(payload: PaymentWriteRequest): Observable<PaymentWriteResult> {
    return this.http.post<PaymentWriteResult>(`${environment.baseUrl}/payments`, payload);
  }

  update(id: string, payload: PaymentWriteRequest): Observable<PaymentWriteResult> {
    return this.http.put<PaymentWriteResult>(`${environment.baseUrl}/payments/${id}`, payload);
  }

  submit(id: string, payload: PaymentActionRequest): Observable<PaymentWriteResult> {
    return this.http.post<PaymentWriteResult>(
      `${environment.baseUrl}/payments/${id}/submit`,
      payload,
    );
  }

  cancelDraft(id: string, payload: PaymentActionRequest): Observable<PaymentWriteResult> {
    return this.http.post<PaymentWriteResult>(
      `${environment.baseUrl}/payments/${id}/cancel`,
      payload,
    );
  }

  decide(id: string, payload: PaymentDecisionRequest): Observable<PaymentWriteResult> {
    return this.http.post<PaymentWriteResult>(
      `${environment.baseUrl}/payments/${id}/decision`,
      payload,
    );
  }
}
