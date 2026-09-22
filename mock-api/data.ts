export type Role = 'MAKER' | 'CHECKER' | 'AUDITOR';
export type PaymentType = 'DOMESTIC' | 'INTERNATIONAL';
export type PaymentStatus =
  'DRAFT' | 'PENDING_CHECK' | 'RETURNED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type Decision = 'APPROVE' | 'RETURN' | 'REJECT';
export type ChargeOption = 'SHA' | 'OUR' | 'BEN';

export interface User {
  userId: string;
  displayName: string;
  role: Role;
  branchCode: string;
  entitlements: string[];
}

export interface Account {
  id: string;
  iban: string;
  masked: string;
  currency: string;
  availableBalance: number;
  status: string;
}

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

export interface AuditEvent {
  event: string;
  actorId: string;
  actorName: string;
  at: string;
  reason?: string;
}

export interface PaymentRecord {
  id: string;
  reference: string;
  type: PaymentType;
  status: PaymentStatus;
  debitAccountId: string;
  debtorAccountMasked: string;
  beneficiaryName: string;
  beneficiaryId?: string;
  beneficiaryAccount?: string;
  bankCode?: string;
  swift?: string;
  country?: string;
  address?: string;
  currency: string;
  amount: number;
  purposeCode?: string;
  remittanceInformation?: string;
  chargeOption?: ChargeOption;
  executionDate?: string;
  makerUserId: string;
  makerName: string;
  createdAt: string;
  updatedAt: string;
  rowVersion: number;
  fxQuoteId?: string;
  audit: AuditEvent[];
}

export interface FxQuote {
  quoteId: string;
  sourceCurrency: string;
  targetCurrency: string;
  rate: number;
  targetAmount: number;
  debitAmount: number;
  expiresAt: string;
}

export const USERS: User[] = [
  {
    userId: 'usr-maker-1',
    displayName: 'Sara Malik',
    role: 'MAKER',
    branchCode: 'LON1',
    entitlements: [],
  },
  {
    userId: 'usr-maker-2',
    displayName: 'James Chen',
    role: 'MAKER',
    branchCode: 'LON1',
    entitlements: [],
  },
  {
    userId: 'usr-maker-3',
    displayName: 'Lina Haddad',
    role: 'MAKER',
    branchCode: 'DXB1',
    entitlements: [],
  },
  {
    userId: 'usr-checker-1',
    displayName: 'Nora Blake',
    role: 'CHECKER',
    branchCode: 'LON1',
    entitlements: ['VIEW_FULL_ACCOUNT'],
  },
  {
    userId: 'usr-auditor-1',
    displayName: 'Omar Said',
    role: 'AUDITOR',
    branchCode: 'LON1',
    entitlements: [],
  },
];

export const CURRENT_USER_ID = 'usr-maker-1';

export const ACCOUNTS: Account[] = [
  {
    id: 'acc-4412',
    iban: 'GB29CUBI0000000004412',
    masked: '**** **** **** 4412',
    currency: 'GBP',
    availableBalance: 2_450_000,
    status: 'ACTIVE',
  },
  {
    id: 'acc-1188',
    iban: 'GB29CUBI0000000001188',
    masked: '**** **** **** 1188',
    currency: 'EUR',
    availableBalance: 890_000,
    status: 'ACTIVE',
  },
  {
    id: 'acc-7721',
    iban: 'GB29CUBI0000000007721',
    masked: '**** **** **** 7721',
    currency: 'USD',
    availableBalance: 1_120_000,
    status: 'ACTIVE',
  },
];

export const BENEFICIARIES: Beneficiary[] = [
  {
    id: 'ben-001',
    name: 'Acme Supplies Ltd',
    account: 'GB12ACME000004412',
    type: 'DOMESTIC',
    bankCode: 'ACMEGB2L',
  },
  {
    id: 'ben-002',
    name: 'Nordic Freight AS',
    account: 'NO9386011117947',
    type: 'INTERNATIONAL',
    swift: 'NDEANOKK',
    country: 'NO',
    address: 'Oslo Harbour 12',
  },
];

export const PAYMENT_TYPE_OPTIONS = [
  { value: 'DOMESTIC' as const, label: 'Domestic' },
  { value: 'INTERNATIONAL' as const, label: 'International' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'DRAFT' as const, label: 'Draft' },
  { value: 'PENDING_CHECK' as const, label: 'Pending check' },
  { value: 'RETURNED' as const, label: 'Returned' },
  { value: 'APPROVED' as const, label: 'Approved' },
  { value: 'REJECTED' as const, label: 'Rejected' },
  { value: 'CANCELLED' as const, label: 'Cancelled' },
];

export const REFERENCE_DATA = {
  currencies: [
    { code: 'GBP', minorUnits: 2 },
    { code: 'EUR', minorUnits: 2 },
    { code: 'USD', minorUnits: 2 },
    { code: 'JPY', minorUnits: 0 },
    { code: 'CHF', minorUnits: 2 },
    { code: 'AED', minorUnits: 2 },
    { code: 'CAD', minorUnits: 2 },
    { code: 'AUD', minorUnits: 2 },
    { code: 'SAR', minorUnits: 2 },
    { code: 'KRW', minorUnits: 0 },
    { code: 'EGP', minorUnits: 2 },
  ],
  paymentTypes: PAYMENT_TYPE_OPTIONS,
  paymentStatuses: PAYMENT_STATUS_OPTIONS,
  purposeCodes: ['SUPP', 'SALA', 'TRAD'],
  chargeOptions: ['SHA', 'OUR', 'BEN'] as ChargeOption[],
};

const HANDCRAFTED: Array<
  [
    string,
    string,
    PaymentType,
    PaymentStatus,
    string,
    string,
    string,
    number,
    string,
    string,
    string,
    string,
    number,
  ]
> = [
  [
    'pay-001',
    'PAY-2026-00041',
    'DOMESTIC',
    'PENDING_CHECK',
    'acc-4412',
    'Acme Supplies Ltd',
    'GBP',
    12500.5,
    'usr-maker-1',
    'Sara Malik',
    '2026-09-12T08:15:00.000Z',
    '2026-09-18T11:42:00.000Z',
    3,
  ],
  [
    'pay-002',
    'PAY-2026-00042',
    'INTERNATIONAL',
    'DRAFT',
    'acc-1188',
    'Nordic Freight AS',
    'EUR',
    8420,
    'usr-maker-1',
    'Sara Malik',
    '2026-09-14T09:30:00.000Z',
    '2026-09-14T09:30:00.000Z',
    1,
  ],
  [
    'pay-003',
    'PAY-2026-00043',
    'DOMESTIC',
    'APPROVED',
    'acc-4412',
    'City Payroll Bureau',
    'GBP',
    210340.75,
    'usr-maker-2',
    'James Chen',
    '2026-09-01T07:00:00.000Z',
    '2026-09-02T16:18:00.000Z',
    4,
  ],
  [
    'pay-004',
    'PAY-2026-00044',
    'INTERNATIONAL',
    'RETURNED',
    'acc-7721',
    'Tokyo Parts Co',
    'JPY',
    1850000,
    'usr-maker-2',
    'James Chen',
    '2026-09-10T12:05:00.000Z',
    '2026-09-16T10:11:00.000Z',
    5,
  ],
  [
    'pay-005',
    'PAY-2026-00045',
    'DOMESTIC',
    'REJECTED',
    'acc-1188',
    'Greenfield Utilities',
    'GBP',
    980.25,
    'usr-maker-3',
    'Lina Haddad',
    '2026-08-28T14:22:00.000Z',
    '2026-08-29T09:40:00.000Z',
    2,
  ],
  [
    'pay-006',
    'PAY-2026-00046',
    'INTERNATIONAL',
    'CANCELLED',
    'acc-4412',
    'Sahara Logistics',
    'USD',
    45000,
    'usr-maker-1',
    'Sara Malik',
    '2026-08-20T11:00:00.000Z',
    '2026-08-21T08:15:00.000Z',
    2,
  ],
  [
    'pay-007',
    'PAY-2026-00047',
    'DOMESTIC',
    'DRAFT',
    'acc-7721',
    'Westbrook Office Park',
    'GBP',
    3200,
    'usr-maker-3',
    'Lina Haddad',
    '2026-09-18T15:40:00.000Z',
    '2026-09-19T08:05:00.000Z',
    1,
  ],
  [
    'pay-008',
    'PAY-2026-00048',
    'INTERNATIONAL',
    'PENDING_CHECK',
    'acc-1188',
    'Helvetia Pharma AG',
    'CHF',
    15750.9,
    'usr-maker-2',
    'James Chen',
    '2026-09-17T10:20:00.000Z',
    '2026-09-19T13:55:00.000Z',
    2,
  ],
  [
    'pay-009',
    'PAY-2026-00049',
    'DOMESTIC',
    'APPROVED',
    'acc-4412',
    'Metro Insurance Brokers',
    'GBP',
    6780,
    'usr-maker-1',
    'Sara Malik',
    '2026-09-05T09:10:00.000Z',
    '2026-09-06T17:30:00.000Z',
    3,
  ],
  [
    'pay-010',
    'PAY-2026-00050',
    'INTERNATIONAL',
    'PENDING_CHECK',
    'acc-7721',
    'Gulf Trade House',
    'AED',
    92000,
    'usr-maker-3',
    'Lina Haddad',
    '2026-09-15T06:45:00.000Z',
    '2026-09-19T07:12:00.000Z',
    2,
  ],
  [
    'pay-011',
    'PAY-2026-00051',
    'DOMESTIC',
    'RETURNED',
    'acc-1188',
    'Oak & Pine Catering',
    'GBP',
    1455.4,
    'usr-maker-2',
    'James Chen',
    '2026-09-11T13:00:00.000Z',
    '2026-09-13T11:22:00.000Z',
    3,
  ],
  [
    'pay-012',
    'PAY-2026-00052',
    'INTERNATIONAL',
    'APPROVED',
    'acc-4412',
    'Maple Leaf Exports',
    'CAD',
    33400,
    'usr-maker-1',
    'Sara Malik',
    '2026-09-03T08:50:00.000Z',
    '2026-09-04T14:05:00.000Z',
    2,
  ],
  [
    'pay-013',
    'PAY-2026-00053',
    'DOMESTIC',
    'DRAFT',
    'acc-7721',
    'Brighton IT Services',
    'GBP',
    5600,
    'usr-maker-3',
    'Lina Haddad',
    '2026-09-19T16:00:00.000Z',
    '2026-09-19T16:00:00.000Z',
    1,
  ],
  [
    'pay-014',
    'PAY-2026-00054',
    'INTERNATIONAL',
    'REJECTED',
    'acc-1188',
    'Pacific Rim Metals',
    'USD',
    128900.15,
    'usr-maker-2',
    'James Chen',
    '2026-09-07T10:33:00.000Z',
    '2026-09-08T12:47:00.000Z',
    3,
  ],
  [
    'pay-015',
    'PAY-2026-00055',
    'DOMESTIC',
    'PENDING_CHECK',
    'acc-4412',
    'Harbour Legal LLP',
    'GBP',
    8900,
    'usr-maker-1',
    'Sara Malik',
    '2026-09-16T09:18:00.000Z',
    '2026-09-18T15:01:00.000Z',
    2,
  ],
  [
    'pay-016',
    'PAY-2026-00056',
    'INTERNATIONAL',
    'DRAFT',
    'acc-7721',
    'Lisbon Cork Works',
    'EUR',
    4120.6,
    'usr-maker-3',
    'Lina Haddad',
    '2026-09-18T07:25:00.000Z',
    '2026-09-18T07:25:00.000Z',
    1,
  ],
  [
    'pay-017',
    'PAY-2026-00057',
    'DOMESTIC',
    'APPROVED',
    'acc-1188',
    'Northstar Facilities',
    'GBP',
    27500,
    'usr-maker-2',
    'James Chen',
    '2026-08-30T11:11:00.000Z',
    '2026-09-01T09:00:00.000Z',
    4,
  ],
  [
    'pay-018',
    'PAY-2026-00058',
    'INTERNATIONAL',
    'CANCELLED',
    'acc-4412',
    'Sydney Marine Parts',
    'AUD',
    18990,
    'usr-maker-1',
    'Sara Malik',
    '2026-08-15T04:40:00.000Z',
    '2026-08-16T10:02:00.000Z',
    2,
  ],
  [
    'pay-019',
    'PAY-2026-00059',
    'DOMESTIC',
    'RETURNED',
    'acc-7721',
    'Kent Fleet Hire',
    'GBP',
    760.8,
    'usr-maker-3',
    'Lina Haddad',
    '2026-09-09T12:12:00.000Z',
    '2026-09-12T08:44:00.000Z',
    3,
  ],
  [
    'pay-020',
    'PAY-2026-00060',
    'INTERNATIONAL',
    'PENDING_CHECK',
    'acc-1188',
    'Riyadh Contracting Group',
    'SAR',
    210000,
    'usr-maker-2',
    'James Chen',
    '2026-09-13T05:30:00.000Z',
    '2026-09-19T06:20:00.000Z',
    2,
  ],
  [
    'pay-021',
    'PAY-2026-00061',
    'DOMESTIC',
    'DRAFT',
    'acc-4412',
    'Elm Street Printers',
    'GBP',
    430.12,
    'usr-maker-1',
    'Sara Malik',
    '2026-09-19T18:10:00.000Z',
    '2026-09-19T18:10:00.000Z',
    1,
  ],
  [
    'pay-022',
    'PAY-2026-00062',
    'INTERNATIONAL',
    'APPROVED',
    'acc-7721',
    'Seoul Display Inc',
    'KRW',
    15400000,
    'usr-maker-3',
    'Lina Haddad',
    '2026-09-02T02:15:00.000Z',
    '2026-09-03T11:50:00.000Z',
    3,
  ],
  [
    'pay-023',
    'PAY-2026-00063',
    'DOMESTIC',
    'PENDING_CHECK',
    'acc-1188',
    'Thames Water Services',
    'GBP',
    11200,
    'usr-maker-2',
    'James Chen',
    '2026-09-17T14:05:00.000Z',
    '2026-09-19T09:33:00.000Z',
    2,
  ],
  [
    'pay-024',
    'PAY-2026-00064',
    'INTERNATIONAL',
    'REJECTED',
    'acc-4412',
    'Cairo Cotton Mills',
    'EGP',
    87500,
    'usr-maker-1',
    'Sara Malik',
    '2026-09-08T13:27:00.000Z',
    '2026-09-09T15:40:00.000Z',
    2,
  ],
];

const STATUSES: PaymentStatus[] = [
  'DRAFT',
  'PENDING_CHECK',
  'RETURNED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
];
const NAMES = [
  'Atlas Components',
  'Blue Harbour Ltd',
  'Cedar Mills',
  'Delta Freight',
  'Eden Foods',
];
const CURRENCIES = REFERENCE_DATA.currencies.map((c) => c.code);

function accountById(id: string): Account {
  return ACCOUNTS.find((a) => a.id === id) ?? ACCOUNTS[0]!;
}

function userById(id: string): User {
  return USERS.find((u) => u.userId === id) ?? USERS[0]!;
}

function toRecord(row: (typeof HANDCRAFTED)[number]): PaymentRecord {
  const account = accountById(row[4]);
  return {
    id: row[0],
    reference: row[1],
    type: row[2],
    status: row[3],
    debitAccountId: row[4],
    debtorAccountMasked: account.masked,
    beneficiaryName: row[5],
    beneficiaryAccount: `GB00BEN${row[0].replace(/\D/g, '').padStart(8, '0')}`.slice(0, 18),
    remittanceInformation: `Invoice ${row[1]}`,
    purposeCode: 'SUPP',
    executionDate: row[10].slice(0, 10),
    currency: row[6],
    amount: row[7],
    makerUserId: row[8],
    makerName: row[9],
    createdAt: row[10],
    updatedAt: row[11],
    rowVersion: row[12],
    audit: [
      {
        event: 'CREATED',
        actorId: row[8],
        actorName: row[9],
        at: row[10],
      },
    ],
  };
}

function generatedPayment(index: number): PaymentRecord {
  const n = index + 25;
  const maker = USERS[n % 3]!;
  const account = ACCOUNTS[n % ACCOUNTS.length]!;
  const created = new Date(Date.UTC(2026, 0, 1 + (n % 250), 8, n % 60));
  return {
    id: `pay-${String(n).padStart(5, '0')}`,
    reference: `PAY-2026-${String(n + 40).padStart(5, '0')}`,
    type: n % 2 === 0 ? 'DOMESTIC' : 'INTERNATIONAL',
    status: STATUSES[n % STATUSES.length]!,
    debitAccountId: account.id,
    debtorAccountMasked: account.masked,
    beneficiaryName: `${NAMES[n % NAMES.length]} ${n}`,
    beneficiaryAccount: `GB00BEN${String(n).padStart(8, '0')}`,
    remittanceInformation: `Invoice ${n}`,
    purposeCode: n % 2 === 0 ? 'SUPP' : 'TRAD',
    executionDate: created.toISOString().slice(0, 10),
    ...(n % 2 === 1
      ? {
          swift: 'NDEANOKK',
          country: 'NO',
          address: 'Oslo Harbour 12',
          chargeOption: 'SHA' as const,
        }
      : { bankCode: 'ACMEGB2L' }),
    currency: CURRENCIES[n % CURRENCIES.length]!,
    amount: 100 + (n % 9000),
    makerUserId: maker.userId,
    makerName: maker.displayName,
    createdAt: created.toISOString(),
    updatedAt: created.toISOString(),
    rowVersion: 1,
    audit: [
      {
        event: 'CREATED',
        actorId: maker.userId,
        actorName: maker.displayName,
        at: created.toISOString(),
      },
    ],
  };
}

export const db = {
  currentUserId: CURRENT_USER_ID,
  payments: [
    ...HANDCRAFTED.map(toRecord),
    ...Array.from({ length: 19_976 }, (_, i) => generatedPayment(i)),
  ],
  quotes: new Map<string, FxQuote>(),
  clientRequests: new Map<string, { status: number; body: unknown }>(),
  nextPaymentSeq: 20_001,
};

export function currentUser(): User {
  return userById(db.currentUserId);
}

const ROLE_LABELS: Record<Role, string> = {
  MAKER: 'Maker',
  CHECKER: 'Checker',
  AUDITOR: 'Auditor',
};

export function currentUserResponse() {
  const user = currentUser();
  return {
    userId: user.userId,
    displayName: user.displayName,
    role: { value: user.role, label: ROLE_LABELS[user.role] },
    branchCode: user.branchCode,
    entitlements: user.entitlements,
  };
}

export function findAccount(id: string): Account | undefined {
  return ACCOUNTS.find((a) => a.id === id);
}

export function maskAccount(account: Account, entitlements: string[]): string {
  return entitlements.includes('VIEW_FULL_ACCOUNT') ? account.iban : account.masked;
}
