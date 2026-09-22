import { Injectable } from '@angular/core';
import { BulkIntakeState, BulkValidationOptions } from '../models/bulk-payment.models';
import { intakeBulkCsvText } from '../parsing/intake-bulk-csv-text';

@Injectable({ providedIn: 'root' })
export class BulkCsvComputeService {
  compute(
    fileName: string,
    text: string,
    options: BulkValidationOptions = {},
  ): Promise<BulkIntakeState> {
    return runOnWorker(fileName, text, options);
  }
}

function runOnWorker(
  fileName: string,
  text: string,
  options: BulkValidationOptions,
): Promise<BulkIntakeState> {
  if (typeof Worker === 'undefined') {
    return Promise.resolve(intakeBulkCsvText(fileName, text, options));
  }
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('../workers/bulk-csv.worker', import.meta.url), {
        type: 'module',
      });
    } catch {
      resolve(intakeBulkCsvText(fileName, text, options));
      return;
    }
    worker.addEventListener('message', (event: MessageEvent<BulkIntakeState>) => {
      worker.terminate();
      resolve(event.data);
    });
    worker.addEventListener('error', () => {
      worker.terminate();
      resolve(intakeBulkCsvText(fileName, text, options));
    });
    worker.postMessage({ fileName, text, options });
  });
}
