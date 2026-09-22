import { Direction } from '../../../shared/components/table/direction';
import { LabelValue } from '../../../shared/models/label-value';
import { PaymentStatus, PaymentType } from '../shared/enums/payment.enums';

export interface PaymentSummary {
  id: string;
  reference: string;
  type: LabelValue<PaymentType>;
  status: LabelValue<PaymentStatus>;
  debtorAccountMasked: string;
  beneficiaryName: string;
  currency: string;
  amount: number;
  makerUserId: string;
  makerName: string;
  createdAt: string;
  updatedAt: string;
  rowVersion: number;
}

export interface PaymentListResponse {
  items: PaymentSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaymentListQuery {
  page: number;
  pageSize: number;
  sort?: string;
  direction?: Direction;
  q?: string;
  status?: PaymentStatus;
  type?: PaymentType;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
}
