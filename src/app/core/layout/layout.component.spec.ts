import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { errorInterceptor } from '../interceptors/error.interceptor';
import { UserRole } from '../session/enums/user-role';
import { CurrentUser } from '../session/models/current-user';
import { LayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
  let fixture: ComponentFixture<LayoutComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LayoutComponent);
  });

  afterEach(() => {
    http.verify();
  });

  it('renders primary navigation', async () => {
    await flushSession(makerUser());
    expect(fixture.nativeElement.textContent).toContain('Work queue');
  });

  it('shows the signed-in user from GET /api/me', async () => {
    await flushSession(makerUser());
    expect(fixture.nativeElement.textContent).toContain('Sara Malik');
    expect(fixture.nativeElement.textContent).toContain('Maker');
    expect(fixture.nativeElement.textContent).toContain('LON1');
    expect(fixture.nativeElement.textContent).toContain('SM');
  });

  it('keeps navigation when GET /api/me fails', async () => {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    http
      .expectOne(`${environment.baseUrl}/me`)
      .flush(
        { code: 'UNEXPECTED_ERROR', message: 'Unavailable' },
        { status: 500, statusText: 'Server Error' },
      );
    await settle();

    expect(fixture.nativeElement.textContent).toContain('Work queue');
    expect(fixture.nativeElement.querySelector('[aria-label="Signed-in user"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('main')).toBeTruthy();
  });

  it('reloads the session when a different user is selected', async () => {
    await flushSession(makerUser());

    const select = fixture.nativeElement.querySelector('#act-as-user') as HTMLSelectElement;
    select.value = 'usr-checker-1';
    select.dispatchEvent(new Event('change'));
    TestBed.inject(ApplicationRef).tick();

    http
      .expectOne(
        (req) =>
          req.url === `${environment.baseUrl}/me` &&
          req.params.get('actingUserId') === 'usr-checker-1',
      )
      .flush(checkerUser());
    await settle();

    expect(fixture.nativeElement.textContent).toContain('Nora Blake');
    expect(fixture.nativeElement.textContent).toContain('Checker');
  });

  async function flushSession(user: CurrentUser): Promise<void> {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    http.expectOne(`${environment.baseUrl}/me`).flush(user);
    await settle();
  }

  async function settle(): Promise<void> {
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});

function checkerUser(): CurrentUser {
  return {
    userId: 'usr-checker-1',
    displayName: 'Nora Blake',
    role: { value: UserRole.Checker, label: 'Checker' },
    branchCode: 'LON1',
    entitlements: [],
  };
}

function makerUser(): CurrentUser {
  return {
    userId: 'usr-maker-1',
    displayName: 'Sara Malik',
    role: { value: UserRole.Maker, label: 'Maker' },
    branchCode: 'LON1',
    entitlements: [],
  };
}
