import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BulkValidatedRow } from '../../models/bulk-payment.models';
import { BulkRowViewportComponent } from './bulk-row-viewport.component';

describe('BulkRowViewportComponent', () => {
  it('renders row errors as text and windows a long list', async () => {
    const rows = Array.from({ length: 80 }, (_, index) =>
      index === 0 ? invalidRow(2, 'REF-BAD') : validRow(index + 2, `REF${index}`),
    );
    const fixture = await create(rows);
    expect(fixture.nativeElement.textContent).toContain('beneficiaryName is required.');
    expect(fixture.nativeElement.querySelectorAll('[data-bulk-row]').length).toBeLessThan(40);
  });
});

async function create(
  rows: BulkValidatedRow[],
): Promise<ComponentFixture<BulkRowViewportComponent>> {
  TestBed.configureTestingModule({ imports: [BulkRowViewportComponent] });
  const fixture = TestBed.createComponent(BulkRowViewportComponent);
  fixture.componentRef.setInput('rows', rows);
  fixture.detectChanges();
  return fixture;
}

function validRow(lineNumber: number, clientReference: string): BulkValidatedRow {
  return { lineNumber, clientReference, row: null, errors: [] };
}

function invalidRow(lineNumber: number, clientReference: string): BulkValidatedRow {
  return {
    lineNumber,
    clientReference,
    row: null,
    errors: [
      {
        lineNumber,
        clientReference,
        field: 'beneficiaryName',
        code: 'REQUIRED',
        message: 'beneficiaryName is required.',
      },
    ],
  };
}
