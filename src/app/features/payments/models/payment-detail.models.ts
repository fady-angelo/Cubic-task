import { LabelValue } from '../../../shared/models/label-value';
import { PaymentStatus, PaymentType } from '../shared/enums/payment.enums';

export interface PaymentAccountView {
  id: string;
  masked: string;
  full?: string;
  currency?: string;
}

export interface PaymentBeneficiaryView {
  id?: string;
  name: string;
  account?: string;
  bankCode?: string;
  swift?: string;
  country?: string;
  address?: string;
}

export interface PaymentAuditEvent {
  event: string;
  actorId: string;
  actorName: string;
  at: string;
  reason?: string;
}

export interface PaymentDetail {
  id: string;
  reference: string;
  type: LabelValue<PaymentType>;
  status: LabelValue<PaymentStatus>;
  makerUserId: string;
  makerName: string;
  debtorAccount: PaymentAccountView;
  beneficiary: PaymentBeneficiaryView;
  currency: string;
  amount: number;
  executionDate?: string;
  purposeCode?: string;
  remittanceInformation?: string;
  chargeOption?: string;
  rowVersion: number;
  fxQuoteId?: string;
  audit: PaymentAuditEvent[];
}
