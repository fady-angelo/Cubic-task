import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { PaymentDetail } from '../models/payment-detail.models';
import { PaymentListQuery, PaymentListResponse } from '../models/payment-list.models';
import { queryToParams } from '../queue/utils/payment-list-query.mapper';

@Injectable({ providedIn: 'root' })
export class PaymentQueryService {
  getPaymentListResource(paymentListQuery: () => PaymentListQuery) {
    return httpResource<PaymentListResponse>(() => ({
      url: `${environment.baseUrl}/payments`,
      params: queryToParams(paymentListQuery()),
    }));
  }

  getPaymentDetailResource(paymentId: () => string) {
    return httpResource<PaymentDetail>(() => {
      const id = paymentId();
      if (!id) {
        return undefined;
      }
      return { url: `${environment.baseUrl}/payments/${id}` };
    });
  }
}
