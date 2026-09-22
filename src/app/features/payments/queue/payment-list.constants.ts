import { TableColumn } from '../../../shared/components/table/table-column';
import {
  PAYMENT_LIST_DEFAULT_DIR,
  PAYMENT_LIST_DEFAULT_SORT,
  PAYMENT_LIST_PAGE_SIZE,
} from './utils/payment-list-query.constants';

export { PAYMENT_LIST_DEFAULT_DIR, PAYMENT_LIST_DEFAULT_SORT, PAYMENT_LIST_PAGE_SIZE };

export const PAYMENT_LIST_DEBOUNCE_MS = 300;

export const PAYMENT_LIST_COLUMNS: TableColumn[] = [
  { key: 'reference', label: 'Reference', sortable: true },
  { key: 'debtorAccountMasked', label: 'Debtor Account', sortable: false },
  { key: 'beneficiaryName', label: 'Beneficiary', sortable: true },
  { key: 'type', label: 'Payment Type', sortable: true },
  { key: 'currency', label: 'Currency', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'makerName', label: 'Maker', sortable: true },
  { key: 'createdAt', label: 'Created Date', sortable: true },
  { key: 'updatedAt', label: 'Last Updated', sortable: true },
];
