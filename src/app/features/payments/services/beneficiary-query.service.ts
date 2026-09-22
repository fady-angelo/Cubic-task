import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BeneficiaryListResponse } from '../models/beneficiary.models';

@Injectable({ providedIn: 'root' })
export class BeneficiaryQueryService {
  getBeneficiariesResource() {
    return httpResource<BeneficiaryListResponse>(() => ({
      url: `${environment.baseUrl}/beneficiaries`,
    }));
  }
}
