import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Entitlement } from './enums/entitlement';
import { UserRole } from './enums/user-role';
import { CurrentUser } from './models/current-user';
import { SessionQueryService } from './session-query.service';

@Component({
  selector: 'app-session-query-host',
  template: '',
})
class SessionQueryHost {
  private readonly sessionQuery = inject(SessionQueryService);
  readonly currentUser = this.sessionQuery.currentUser;
}

describe('SessionQueryService', () => {
  let fixture: ComponentFixture<SessionQueryHost>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionQueryHost],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SessionQueryHost);
  });

  afterEach(() => {
    http.verify();
  });

  it('GETs /api/me and exposes userId, role, and entitlements', async () => {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();

    const req = http.expectOne(`${environment.baseUrl}/me`);
    expect(req.request.method).toBe('GET');
    req.flush(checkerUser());
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();
    fixture.detectChanges();

    const user = fixture.componentInstance.currentUser.value();
    expect(user?.userId).toBe('usr-checker-1');
    expect(user?.role).toEqual({ value: UserRole.Checker, label: 'Checker' });
    expect(user?.entitlements).toEqual([Entitlement.ViewFullAccount]);
  });

  it('reloads GET /api/me?actingUserId= when switchUser is called', async () => {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    http.expectOne(`${environment.baseUrl}/me`).flush(checkerUser());
    await fixture.whenStable();

    TestBed.inject(SessionQueryService).switchUser('usr-auditor-1');
    TestBed.inject(ApplicationRef).tick();

    const req = http.expectOne(
      (request) =>
        request.url === `${environment.baseUrl}/me` &&
        request.params.get('actingUserId') === 'usr-auditor-1',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      userId: 'usr-auditor-1',
      displayName: 'Omar Said',
      role: { value: UserRole.Auditor, label: 'Auditor' },
      branchCode: 'LON1',
      entitlements: [],
    });
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();

    expect(TestBed.inject(SessionQueryService).user()?.userId).toBe('usr-auditor-1');
  });
});

function checkerUser(): CurrentUser {
  return {
    userId: 'usr-checker-1',
    displayName: 'Nora Blake',
    role: { value: UserRole.Checker, label: 'Checker' },
    branchCode: 'LON1',
    entitlements: [Entitlement.ViewFullAccount],
  };
}
