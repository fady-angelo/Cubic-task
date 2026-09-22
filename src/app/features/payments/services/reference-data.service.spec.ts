import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ReferenceDataService } from './reference-data.service';

@Component({
  selector: 'app-reference-data-host',
  template: '',
})
class ReferenceDataHost {
  private readonly referenceData = inject(ReferenceDataService);
  readonly resource = this.referenceData.getReferenceDataResource();
}

describe('ReferenceDataService', () => {
  let fixture: ComponentFixture<ReferenceDataHost>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferenceDataHost],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ReferenceDataHost);
  });

  afterEach(() => {
    http.verify();
  });

  it('GETs /api/reference-data', () => {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    const req = http.expectOne(`${environment.baseUrl}/reference-data`);
    expect(req.request.method).toBe('GET');
    req.flush({
      currencies: [],
      paymentTypes: [{ value: 'DOMESTIC', label: 'Domestic' }],
      paymentStatuses: [{ value: 'DRAFT', label: 'Draft' }],
      purposeCodes: [],
      chargeOptions: [],
    });
  });
});
