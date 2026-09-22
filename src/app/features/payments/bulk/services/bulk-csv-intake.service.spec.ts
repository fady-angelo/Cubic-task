import { TestBed } from '@angular/core/testing';
import { intakeBulkCsvText } from '../parsing/intake-bulk-csv-text';
import { BulkCsvComputeService } from './bulk-csv-compute.service';
import { BulkCsvIntakeService } from './bulk-csv-intake.service';

describe('BulkCsvIntakeService', () => {
  it('ignores a stale compute result', async () => {
    let releaseFirst: (value: ReturnType<typeof intakeBulkCsvText>) => void = () => undefined;
    const first = new Promise<ReturnType<typeof intakeBulkCsvText>>((resolve) => {
      releaseFirst = resolve;
    });
    const compute = {
      compute: vi
        .fn()
        .mockImplementationOnce(() => first)
        .mockImplementationOnce(() =>
          Promise.resolve(intakeBulkCsvText('b.csv', csv('REF2'), { today: '2026-09-22' })),
        ),
    };

    TestBed.configureTestingModule({
      providers: [BulkCsvIntakeService, { provide: BulkCsvComputeService, useValue: compute }],
    });
    const service = TestBed.inject(BulkCsvIntakeService);

    const stale = service.ingest('a.csv', csv('REF1'), { today: '2026-09-22' });
    const latest = await service.ingest('b.csv', csv('REF2'), { today: '2026-09-22' });
    releaseFirst(intakeBulkCsvText('a.csv', csv('REF1'), { today: '2026-09-22' }));

    expect(await stale).toBeNull();
    expect(latest?.kind).toBe('parsed');
    if (latest?.kind === 'parsed') {
      expect(latest.fileName).toBe('b.csv');
    }
  });
});

function csv(reference: string): string {
  return `clientReference,beneficiaryName,beneficiaryAccount,bankCodeOrSwift,currency,amount,executionDate,purposeCode\n${reference},Acme,ACC1,NWBK,GBP,10.00,2026-09-23,SALA`;
}
