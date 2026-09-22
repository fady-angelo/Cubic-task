import { PaymentStatus, PaymentType } from '../shared/enums/payment.enums';

export interface PaymentActionRequest {
  rowVersion: number;
  clientRequestId: string;
}

export interface PaymentWriteBeneficiary {
  id?: string;
  name: string;
  account: string;
  bankCode?: string;
  swift?: string;
  country?: string;
  address?: string;
}

export interface PaymentWriteRequest {
  clientRequestId: string;
  rowVersion?: number;
  type: PaymentType;
  debtorAccountId: string;
  beneficiary: PaymentWriteBeneficiary;
  currency: string;
  amount: number;
  executionDate: string;
  purposeCode: string;
  remittanceInformation: string;
  chargeOption?: string;
  fxQuoteId?: string;
}

export interface PaymentCommandPayload {
  id: string;
  body: PaymentActionRequest;
}

export type PaymentDecision = 'APPROVE' | 'RETURN' | 'REJECT';

export interface PaymentDecisionRequest extends PaymentActionRequest {
  decision: PaymentDecision;
  reason?: string;
}

export interface PaymentWriteResult {
  id: string;
  reference: string;
  status: PaymentStatus | string;
  makerUserId: string;
  rowVersion: number;
}
