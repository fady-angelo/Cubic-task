import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BulkValidationSummary } from '../../models/bulk-payment.models';
import { BulkSummaryComponent } from './bulk-summary.component';

describe('BulkSummaryComponent', () => {
  it('renders counts and amount by currency', async () => {
    const fixture = await create({
      totalRows: 3,
      validRows: 2,
      invalidRows: 1,
      duplicateClientReferenceCount: 0,
      amountByCurrency: [{ currency: 'GBP', amount: 15 }],
    });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Total rows');
    expect(text).toContain('3');
    expect(text).toContain('Valid rows');
    expect(text).toContain('2');
    expect(text).toContain('Invalid rows');
    expect(text).toContain('1');
    expect(text).toContain('GBP 15');
  });
});

async function create(
  summary: BulkValidationSummary,
): Promise<ComponentFixture<BulkSummaryComponent>> {
  TestBed.configureTestingModule({ imports: [BulkSummaryComponent] });
  const fixture = TestBed.createComponent(BulkSummaryComponent);
  fixture.componentRef.setInput('fileName', 'batch.csv');
  fixture.componentRef.setInput('summary', summary);
  fixture.componentRef.setInput('invalidOnly', false);
  fixture.detectChanges();
  return fixture;
}
