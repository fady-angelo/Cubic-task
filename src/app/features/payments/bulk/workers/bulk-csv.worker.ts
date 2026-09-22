/// <reference lib="webworker" />

import { BulkValidationOptions } from '../models/bulk-payment.models';
import { intakeBulkCsvText } from '../parsing/intake-bulk-csv-text';

addEventListener('message', (event: MessageEvent<BulkWorkerRequest>) => {
  const { fileName, text, options } = event.data;
  postMessage(intakeBulkCsvText(fileName, text, options ?? {}));
});

interface BulkWorkerRequest {
  fileName: string;
  text: string;
  options?: BulkValidationOptions;
}
