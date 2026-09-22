import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { App } from './app';

describe('App', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(App);
    await flushSession(fixture);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the work queue navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await flushSession(fixture);
    expect(fixture.nativeElement.textContent).toContain('Work queue');
  });

  async function flushSession(fixture: ComponentFixture<App>): Promise<void> {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    http.match(`${environment.baseUrl}/me`).forEach((req) =>
      req.flush({
        userId: 'usr-maker-1',
        displayName: 'Sara Malik',
        role: { value: 'MAKER', label: 'Maker' },
        branchCode: 'LON1',
        entitlements: [],
      }),
    );
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});
