import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ReferenceData } from '../models/reference-data';

@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  getReferenceDataResource() {
    return httpResource<ReferenceData>(() => ({
      url: `${environment.baseUrl}/reference-data`,
    }));
  }
}
