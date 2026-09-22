import { PaymentType } from '../shared/enums/payment.enums';

export interface Beneficiary {
  id: string;
  name: string;
  type: PaymentType;
  account: string;
  bankCode?: string;
  swift?: string;
  country?: string;
  address?: string;
}

export interface BeneficiaryListResponse {
  items: Beneficiary[];
}
