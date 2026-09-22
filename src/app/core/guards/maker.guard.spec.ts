import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole } from '../session/enums/user-role';
import { CurrentUser } from '../session/models/current-user';
import { makerGuard } from './maker.guard';

describe('makerGuard', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('allows a Maker', async () => {
    expect(await activate(makerUser())).toBe(true);
  });

  it('redirects a Checker to the queue', async () => {
    expect(isQueueRedirect(await activate(checkerUser()))).toBe(true);
  });

  it('redirects an Auditor to the queue', async () => {
    expect(isQueueRedirect(await activate(auditorUser()))).toBe(true);
  });

  async function activate(user: CurrentUser): Promise<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(() =>
      makerGuard(undefined!, undefined!),
    ) as Observable<boolean | UrlTree>;
    const pending = firstValueFrom(result);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne((req) => req.url === `${environment.baseUrl}/me`).flush(user);
    TestBed.inject(ApplicationRef).tick();
    return pending;
  }

  function isQueueRedirect(result: boolean | UrlTree): boolean {
    return result instanceof UrlTree && TestBed.inject(Router).serializeUrl(result) === '/payments';
  }
});

function makerUser(): CurrentUser {
  return {
    userId: 'usr-maker-1',
    displayName: 'Sara Malik',
    role: { value: UserRole.Maker, label: 'Maker' },
    branchCode: 'LON1',
    entitlements: [],
  };
}

function checkerUser(): CurrentUser {
  return {
    userId: 'usr-checker-1',
    displayName: 'Nora Blake',
    role: { value: UserRole.Checker, label: 'Checker' },
    branchCode: 'LON1',
    entitlements: [],
  };
}

function auditorUser(): CurrentUser {
  return {
    userId: 'usr-auditor-1',
    displayName: 'Omar Said',
    role: { value: UserRole.Auditor, label: 'Auditor' },
    branchCode: 'LON1',
    entitlements: [],
  };
}
