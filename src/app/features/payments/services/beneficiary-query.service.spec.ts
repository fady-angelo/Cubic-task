import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { BeneficiaryQueryService } from './beneficiary-query.service';

@Component({
  selector: 'app-beneficiary-query-service-host',
  template: '',
})
class BeneficiaryQueryServiceHost {
  private readonly beneficiaryQuery = inject(BeneficiaryQueryService);
  readonly beneficiariesResource = this.beneficiaryQuery.getBeneficiariesResource();
}

describe('BeneficiaryQueryService', () => {
  let fixture: ComponentFixture<BeneficiaryQueryServiceHost>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryQueryServiceHost],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BeneficiaryQueryServiceHost);
  });

  afterEach(() => {
    http.verify();
  });

  it('GETs /api/beneficiaries', () => {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();

    const req = http.expectOne(`${environment.baseUrl}/beneficiaries`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });
});
