import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { errorInterceptor } from '../../../../../core/interceptors/error.interceptor';
import { makerGuard } from '../../../../../core/guards/maker.guard';
import { paymentsRoutes } from '../../../payments.routes';
import { intakeBulkCsvText } from '../../parsing/intake-bulk-csv-text';
import { BulkCsvComputeService } from '../../services/bulk-csv-compute.service';
import { BulkPaymentPageComponent } from './bulk-payment-page.component';

const HEADER =
  'clientReference,beneficiaryName,beneficiaryAccount,bankCodeOrSwift,currency,amount,executionDate,purposeCode';

describe('BulkPaymentPageComponent', () => {
  let fixture: ComponentFixture<BulkPaymentPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkPaymentPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: BulkCsvComputeService,
          useValue: {
            compute: (fileName: string, text: string) =>
              Promise.resolve(intakeBulkCsvText(fileName, text, { today: '2026-09-22' })),
          },
        },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BulkPaymentPageComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('renders the upload page with a CSV file input', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Upload bulk payments');
    expect(text).toContain('No file selected yet.');
  });

  it('rejects a non-CSV file without parsing', async () => {
    await chooseFile(fixture, new File(['hello'], 'notes.txt', { type: 'text/plain' }));
    expect(fixture.nativeElement.textContent).toContain('Only CSV files are accepted.');
  });

  it('shows summary counts for a mixed file', async () => {
    await chooseFile(fixture, mixedCsv('mixed.csv'));
    const state = fixture.componentInstance.intake();
    expect(state.kind).toBe('parsed');
    if (state.kind === 'parsed') {
      expect(state.validation.summary.invalidRows).toBe(1);
    }
    expect(fixture.nativeElement.textContent).toContain('beneficiaryName is required.');
  });

  it('filters to invalid rows without dropping validation', async () => {
    await chooseFile(fixture, mixedCsv('mixed.csv'));
    clickButton(fixture, 'Invalid only');
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('REF1');
    expect(text).toContain('REF2');
  });

  it('does not POST a file with local validation errors', async () => {
    await chooseFile(fixture, mixedCsv('mixed.csv'));
    expect(submitButton(fixture).disabled).toBe(true);
    fixture.componentInstance.submitBulk();
    http.verify();
  });

  it('POSTs a valid file once and shows rejectedRows with local validation intact', async () => {
    await chooseFile(fixture, validCsv('ok.csv'));
    submitButton(fixture).click();
    fixture.detectChanges();
    submitButton(fixture).click();
    const req = http.expectOne(`${environment.baseUrl}/bulk-payments`);
    expect(req.request.body.clientRequestId).toBeTruthy();
    req.flush({
      batchId: 'bulk-1',
      receivedRows: 1,
      acceptedRows: 0,
      rejectedRows: [
        { row: 2, clientReference: 'REF1', code: 'INVALID_ROW', message: 'Rejected by server' },
      ],
      status: 'PARTIAL',
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Batch bulk-1');
    expect(text).toContain('Server: Rejected by server');
    const state = fixture.componentInstance.intake();
    expect(state.kind).toBe('parsed');
    if (state.kind === 'parsed') {
      expect(state.validation.summary.validRows).toBe(1);
      expect(state.validation.rows[0]?.errors).toHaveLength(0);
    }
  });

  it('shows a 422 without clearing local validation', async () => {
    await chooseFile(fixture, validCsv('ok.csv'));
    submitButton(fixture).click();
    fixture.detectChanges();
    http
      .expectOne(`${environment.baseUrl}/bulk-payments`)
      .flush(
        { code: 'VALIDATION_ERROR', message: 'Maximum 2,000 data rows' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Maximum 2,000 data rows');
    expect(fixture.componentInstance.intake().kind).toBe('parsed');
  });

  it('clears a previous result when a new file is rejected', async () => {
    await chooseFile(fixture, mixedCsv('ok.csv'));
    await chooseFile(fixture, new File(['x'], 'notes.txt', { type: 'text/plain' }));
    expect(fixture.nativeElement.textContent).toContain('Only CSV files are accepted.');
  });
});

describe('payments bulk route', () => {
  it('loads BulkPaymentPageComponent behind makerGuard', () => {
    const bulk = paymentsRoutes.find((route) => route.path === 'bulk');
    expect(bulk?.canActivate).toEqual([makerGuard]);
    expect(bulk?.loadComponent).toBeDefined();
  });
});

async function chooseFile(
  fixture: ComponentFixture<BulkPaymentPageComponent>,
  file: File,
): Promise<void> {
  const input = fixture.nativeElement.querySelector('#bulk-csv-file') as HTMLInputElement;
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: fileListOf(file),
  });
  input.dispatchEvent(new Event('change'));
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

function mixedCsv(name: string): File {
  return csvFile(
    name,
    `${HEADER}
REF1,Acme,ACC1,NWBK,GBP,10.00,2026-09-23,SALA
REF2,,ACC1,NWBK,GBP,5.00,2026-09-23,SALA`,
  );
}

function validCsv(name: string): File {
  return csvFile(name, `${HEADER}\nREF1,Acme,ACC1,NWBK,GBP,10.00,2026-09-23,SALA`);
}

function csvFile(name: string, body: string): File {
  return new File([body], name, { type: 'text/csv' });
}

function submitButton(fixture: ComponentFixture<BulkPaymentPageComponent>): HTMLButtonElement {
  return clickButton(fixture, 'Submit');
}

function clickButton(
  fixture: ComponentFixture<BulkPaymentPageComponent>,
  label: string,
): HTMLButtonElement {
  const button = [...fixture.nativeElement.querySelectorAll('button')].find((item) =>
    item.textContent?.includes(label),
  ) as HTMLButtonElement;
  if (label !== 'Submit') {
    button.click();
    fixture.detectChanges();
  }
  return button;
}

function fileListOf(file: File): FileList {
  return {
    0: file,
    length: 1,
    item: (index: number) => (index === 0 ? file : null),
  } as unknown as FileList;
}
