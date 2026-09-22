import { Injectable, inject } from '@angular/core';
import { BulkIntakeState, BulkValidationOptions } from '../models/bulk-payment.models';
import { BulkCsvComputeService } from './bulk-csv-compute.service';

@Injectable({ providedIn: 'root' })
export class BulkCsvIntakeService {
  private readonly compute = inject(BulkCsvComputeService);
  private generation = 0;

  cancelPending(): void {
    this.generation += 1;
  }

  async ingest(
    fileName: string,
    text: string,
    options: BulkValidationOptions = {},
  ): Promise<BulkIntakeState | null> {
    const generation = ++this.generation;
    const state = await this.compute.compute(fileName, text, options);
    if (generation !== this.generation) {
      return null;
    }
    return state;
  }
}
