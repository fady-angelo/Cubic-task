import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AccountQueryService } from './account-query.service';

@Component({
  selector: 'app-account-query-service-host',
  template: '',
})
class AccountQueryServiceHost {
  private readonly accountQuery = inject(AccountQueryService);
  readonly accountsResource = this.accountQuery.getAccountsResource();
}

describe('AccountQueryService', () => {
  let fixture: ComponentFixture<AccountQueryServiceHost>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountQueryServiceHost],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AccountQueryServiceHost);
  });

  afterEach(() => {
    http.verify();
  });

  it('GETs /api/accounts', () => {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();

    const req = http.expectOne(`${environment.baseUrl}/accounts`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });
});
