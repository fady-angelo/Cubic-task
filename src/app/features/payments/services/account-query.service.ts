import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AccountListResponse } from '../models/account.models';

@Injectable({ providedIn: 'root' })
export class AccountQueryService {
  getAccountsResource() {
    return httpResource<AccountListResponse>(() => ({
      url: `${environment.baseUrl}/accounts`,
    }));
  }
}
