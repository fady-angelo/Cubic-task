import { FormControl, FormGroup } from '@angular/forms';
import { PaymentType } from '../../shared/enums/payment.enums';

export type BeneficiaryMode = 'existing' | 'new';

export type PaymentSourceFormGroup = FormGroup<{
  debitAccountId: FormControl<string>;
  type: FormControl<PaymentType | ''>;
  executionDate: FormControl<string>;
}>;

export type PaymentBeneficiaryFormGroup = FormGroup<{
  mode: FormControl<BeneficiaryMode>;
  existingId: FormControl<string>;
  name: FormControl<string>;
  account: FormControl<string>;
  bankCode: FormControl<string>;
  swift: FormControl<string>;
  country: FormControl<string>;
  address: FormControl<string>;
}>;

export type PaymentDetailsFormGroup = FormGroup<{
  amount: FormControl<number | null>;
  currency: FormControl<string>;
  purposeCode: FormControl<string>;
  remittanceInformation: FormControl<string>;
  chargeOption: FormControl<string>;
}>;

export type PaymentForm = FormGroup<{
  source: PaymentSourceFormGroup;
  beneficiary: PaymentBeneficiaryFormGroup;
  payment: PaymentDetailsFormGroup;
}>;

export interface PaymentReviewSummary {
  debitAccount: string;
  beneficiary: string;
  amount: string;
  type: string;
  executionDate: string;
}
