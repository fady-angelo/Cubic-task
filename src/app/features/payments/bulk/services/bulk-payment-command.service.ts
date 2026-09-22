import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ActionInProgressError } from '../../../../core/errors/action-in-progress.error';
import { BulkSubmitResult } from '../models/bulk-payment.models';

@Injectable({ providedIn: 'root' })
export class BulkPaymentCommandService {
  private readonly http = inject(HttpClient);
  private inFlight = false;

  newClientRequestId(): string {
    return crypto.randomUUID();
  }

  submit(csv: string, clientRequestId: string): Observable<BulkSubmitResult> {
    if (this.inFlight) {
      return throwError(() => new ActionInProgressError());
    }
    this.inFlight = true;
    return this.http
      .post<BulkSubmitResult>(`${environment.baseUrl}/bulk-payments`, { csv, clientRequestId })
      .pipe(finalize(() => (this.inFlight = false)));
  }
}
