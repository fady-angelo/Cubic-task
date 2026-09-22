import { LabelValue } from '../../../shared/models/label-value';

export interface ReferenceData {
  currencies: { code: string; minorUnits: number }[];
  paymentTypes: LabelValue[];
  paymentStatuses: LabelValue[];
  purposeCodes: string[];
  chargeOptions: string[];
}
