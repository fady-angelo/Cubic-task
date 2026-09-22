import express, { Request, Response } from 'express';
import {
  ACCOUNTS,
  BENEFICIARIES,
  CURRENT_USER_ID,
  ChargeOption,
  Decision,
  PaymentRecord,
  PaymentStatus,
  PaymentType,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
  REFERENCE_DATA,
  USERS,
  currentUser,
  currentUserResponse,
  db,
  findAccount,
} from './data';
import { filterSortPaginate, labeled, queryFromRequest } from './query';

const PORT = 3000;
const app = express();
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  next();
});
app.use(express.json({ limit: '6mb' }));
app.use(express.text({ type: 'text/csv', limit: '6mb' }));

function error(
  res: Response,
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
): void {
  res.status(status).json({ code, message, ...extra });
}

function requireClientRequestId(req: Request, res: Response): string | null {
  const id = req.body?.clientRequestId;
  if (typeof id !== 'string' || !id) {
    error(res, 422, 'VALIDATION_ERROR', 'clientRequestId is required', {
      fieldErrors: { clientRequestId: 'Required' },
    });
    return null;
  }
  const cached = db.clientRequests.get(id);
  if (cached) {
    res.status(cached.status).json(cached.body);
    return null;
  }
  return id;
}

function remember(clientRequestId: string, status: number, body: unknown): void {
  db.clientRequests.set(clientRequestId, { status, body });
}

function findPayment(id: string): PaymentRecord | undefined {
  return db.payments.find((row) => row.id === id);
}

function requireRowVersion(payment: PaymentRecord, rowVersion: unknown, res: Response): boolean {
  if (typeof rowVersion !== 'number') {
    error(res, 422, 'VALIDATION_ERROR', 'rowVersion is required', {
      fieldErrors: { rowVersion: 'Required' },
    });
    return false;
  }
  if (rowVersion !== payment.rowVersion) {
    error(res, 409, 'STALE_VERSION', 'Payment was updated by another request', {
      currentRowVersion: payment.rowVersion,
    });
    return false;
  }
  return true;
}

function bump(payment: PaymentRecord, event: string, reason?: string): void {
  const actor = currentUser();
  payment.rowVersion += 1;
  payment.updatedAt = new Date().toISOString();
  payment.audit.push({
    event,
    actorId: actor.userId,
    actorName: actor.displayName,
    at: payment.updatedAt,
    reason,
  });
}

function writeResult(payment: PaymentRecord, extra: Record<string, unknown> = {}) {
  return {
    id: payment.id,
    reference: payment.reference,
    status: payment.status,
    makerUserId: payment.makerUserId,
    rowVersion: payment.rowVersion,
    ...extra,
  };
}

function toDetail(payment: PaymentRecord) {
  const user = currentUser();
  const account = findAccount(payment.debitAccountId);
  const entitled = user.entitlements.includes('VIEW_FULL_ACCOUNT');
  return {
    id: payment.id,
    reference: payment.reference,
    type: labeled(PAYMENT_TYPE_OPTIONS, payment.type),
    status: labeled(PAYMENT_STATUS_OPTIONS, payment.status),
    makerUserId: payment.makerUserId,
    makerName: payment.makerName,
    debtorAccount: {
      id: payment.debitAccountId,
      masked: account?.masked ?? payment.debtorAccountMasked,
      full: entitled ? (account?.iban ?? payment.beneficiaryAccount) : undefined,
      currency: account?.currency ?? payment.currency,
    },
    beneficiary: {
      id: payment.beneficiaryId,
      name: payment.beneficiaryName,
      account: entitled ? payment.beneficiaryAccount : maskTail(payment.beneficiaryAccount),
      bankCode: payment.bankCode,
      swift: payment.swift,
      country: payment.country,
      address: payment.address,
    },
    currency: payment.currency,
    amount: payment.amount,
    executionDate: payment.executionDate,
    purposeCode: payment.purposeCode,
    remittanceInformation: payment.remittanceInformation,
    chargeOption: payment.chargeOption,
    rowVersion: payment.rowVersion,
    fxQuoteId: payment.fxQuoteId,
    audit: payment.audit,
  };
}

function maskTail(value?: string): string | undefined {
  if (!value) {
    return value;
  }
  return `**** ${value.slice(-4)}`;
}

type WriteBody = {
  type?: PaymentType;
  debtorAccountId?: string;
  debitAccountId?: string;
  beneficiary?: {
    id?: string;
    name?: string;
    account?: string;
    bankCode?: string;
    swift?: string;
    country?: string;
    address?: string;
  };
  beneficiaryName?: string;
  beneficiaryAccount?: string;
  bankCode?: string;
  swift?: string;
  country?: string;
  address?: string;
  currency?: string;
  amount?: number;
  executionDate?: string;
  purposeCode?: string;
  remittanceInformation?: string;
  chargeOption?: ChargeOption;
  fxQuoteId?: string;
};

function applyWriteBody(payment: PaymentRecord, body: WriteBody): void {
  const debtorAccountId = body.debtorAccountId ?? body.debitAccountId;
  if (debtorAccountId) {
    payment.debitAccountId = debtorAccountId;
    const account = findAccount(debtorAccountId);
    if (account) {
      payment.debtorAccountMasked = account.masked;
    }
  }
  const beneficiary = body.beneficiary;
  payment.beneficiaryId = beneficiary?.id ?? payment.beneficiaryId;
  payment.beneficiaryName = beneficiary?.name ?? body.beneficiaryName ?? payment.beneficiaryName;
  payment.beneficiaryAccount =
    beneficiary?.account ?? body.beneficiaryAccount ?? payment.beneficiaryAccount;
  payment.currency = body.currency ?? payment.currency;
  payment.amount = body.amount ?? payment.amount;
  payment.executionDate = body.executionDate ?? payment.executionDate;
  payment.purposeCode = body.purposeCode ?? payment.purposeCode;
  payment.remittanceInformation = body.remittanceInformation ?? payment.remittanceInformation;
  payment.fxQuoteId = body.fxQuoteId ?? payment.fxQuoteId;

  const type = body.type ?? payment.type;
  if (type === 'DOMESTIC') {
    payment.type = 'DOMESTIC';
    payment.bankCode = beneficiary?.bankCode ?? body.bankCode;
    payment.swift = undefined;
    payment.country = undefined;
    payment.address = undefined;
    payment.chargeOption = undefined;
  } else if (type === 'INTERNATIONAL') {
    payment.type = 'INTERNATIONAL';
    payment.bankCode = undefined;
    payment.swift = beneficiary?.swift ?? body.swift;
    payment.country = beneficiary?.country ?? body.country;
    payment.address = beneficiary?.address ?? body.address;
    payment.chargeOption = body.chargeOption;
  }
}

app.get('/api/me', (req, res) => {
  const actingUserId =
    typeof req.query.actingUserId === 'string' ? req.query.actingUserId : undefined;
  if (actingUserId && USERS.some((user) => user.userId === actingUserId)) {
    db.currentUserId = actingUserId;
  }
  res.json(currentUserResponse());
});

app.get('/api/accounts', (_req, res) => {
  res.json({ items: ACCOUNTS });
});

app.get('/api/beneficiaries', (_req, res) => {
  res.json({ items: BENEFICIARIES });
});

app.get('/api/reference-data', (_req, res) => {
  res.json(REFERENCE_DATA);
});

app.get('/api/payments', (req, res) => {
  const query = queryFromRequest(req.query as Record<string, unknown>);
  res.json(filterSortPaginate(db.payments, query));
});

app.get('/api/payments/:id', (req, res) => {
  const payment = findPayment(req.params['id'] ?? '');
  if (!payment) {
    error(res, 404, 'NOT_FOUND', 'Payment not found');
    return;
  }
  res.json(toDetail(payment));
});

app.post('/api/payments', (req, res) => {
  const clientRequestId = requireClientRequestId(req, res);
  if (!clientRequestId) return;
  const body = req.body as WriteBody;
  const debtorAccountId = body.debtorAccountId ?? body.debitAccountId ?? '';
  const account = findAccount(debtorAccountId);
  if (!account) {
    const payload = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid debit account',
      fieldErrors: { debtorAccountId: 'Unknown account' },
    };
    remember(clientRequestId, 422, payload);
    error(res, 422, payload.code, payload.message, { fieldErrors: payload.fieldErrors });
    return;
  }
  if (!body.amount || body.amount <= 0) {
    const payload = {
      code: 'VALIDATION_ERROR',
      message: 'Amount must be greater than zero',
      fieldErrors: { amount: 'Must be greater than 0' },
    };
    remember(clientRequestId, 422, payload);
    error(res, 422, payload.code, payload.message, { fieldErrors: payload.fieldErrors });
    return;
  }
  const actor = currentUser();
  const seq = db.nextPaymentSeq++;
  const now = new Date().toISOString();
  const payment: PaymentRecord = {
    id: `pay-${String(seq).padStart(5, '0')}`,
    reference: `PAY-2026-${String(seq).padStart(5, '0')}`,
    type: body.type ?? 'DOMESTIC',
    status: 'DRAFT',
    debitAccountId: account.id,
    debtorAccountMasked: account.masked,
    beneficiaryName: body.beneficiary?.name ?? 'New beneficiary',
    createdAt: now,
    updatedAt: now,
    makerUserId: actor.userId,
    makerName: actor.displayName,
    amount: body.amount,
    currency: body.currency ?? account.currency,
    rowVersion: 1,
    audit: [
      {
        event: 'CREATED',
        actorId: actor.userId,
        actorName: actor.displayName,
        at: now,
      },
    ],
  };
  applyWriteBody(payment, body);
  db.payments.unshift(payment);
  const result = writeResult(payment);
  remember(clientRequestId, 201, result);
  res.status(201).json(result);
});

app.put('/api/payments/:id', (req, res) => {
  const clientRequestId = requireClientRequestId(req, res);
  if (!clientRequestId) return;
  const payment = findPayment(req.params['id'] ?? '');
  if (!payment) {
    error(res, 404, 'NOT_FOUND', 'Payment not found');
    return;
  }
  if (!requireRowVersion(payment, req.body?.rowVersion, res)) return;
  applyWriteBody(payment, req.body as WriteBody);
  bump(payment, 'UPDATED');
  const result = writeResult(payment);
  remember(clientRequestId, 200, result);
  res.json(result);
});

app.post('/api/payments/:id/submit', (req, res) => {
  const clientRequestId = requireClientRequestId(req, res);
  if (!clientRequestId) return;
  const actor = currentUser();
  if (actor.role === 'AUDITOR') {
    error(res, 403, 'FORBIDDEN', 'Auditors cannot submit payments');
    return;
  }
  const payment = findPayment(req.params['id'] ?? '');
  if (!payment) {
    error(res, 404, 'NOT_FOUND', 'Payment not found');
    return;
  }
  if (!requireRowVersion(payment, req.body?.rowVersion, res)) return;
  if (payment.status !== 'DRAFT' && payment.status !== 'RETURNED') {
    error(res, 422, 'VALIDATION_ERROR', 'Only draft or returned payments can be submitted');
    return;
  }
  payment.status = 'PENDING_CHECK' as PaymentStatus;
  bump(payment, 'SUBMITTED');
  const result = writeResult(payment);
  remember(clientRequestId, 200, result);
  res.json(result);
});

app.post('/api/payments/:id/cancel', (req, res) => {
  const clientRequestId = requireClientRequestId(req, res);
  if (!clientRequestId) return;
  const actor = currentUser();
  if (actor.role !== 'MAKER') {
    error(res, 403, 'FORBIDDEN', 'Only makers can cancel drafts');
    return;
  }
  const payment = findPayment(req.params['id'] ?? '');
  if (!payment) {
    error(res, 404, 'NOT_FOUND', 'Payment not found');
    return;
  }
  if (!requireRowVersion(payment, req.body?.rowVersion, res)) return;
  if (payment.status !== 'DRAFT') {
    error(res, 422, 'VALIDATION_ERROR', 'Only draft payments can be cancelled');
    return;
  }
  if (payment.makerUserId !== actor.userId) {
    error(res, 403, 'FORBIDDEN', 'You can only cancel your own drafts');
    return;
  }
  payment.status = 'CANCELLED' as PaymentStatus;
  bump(payment, 'CANCELLED');
  const result = writeResult(payment);
  remember(clientRequestId, 200, result);
  res.json(result);
});

app.post('/api/payments/:id/decision', (req, res) => {
  const clientRequestId = requireClientRequestId(req, res);
  if (!clientRequestId) return;
  const actor = currentUser();
  if (actor.role !== 'CHECKER') {
    error(res, 403, 'FORBIDDEN', 'Only checkers can decide payments');
    return;
  }
  const payment = findPayment(req.params['id'] ?? '');
  if (!payment) {
    error(res, 404, 'NOT_FOUND', 'Payment not found');
    return;
  }
  if (!requireRowVersion(payment, req.body?.rowVersion, res)) return;
  const decision = req.body?.decision as Decision | undefined;
  const reason = req.body?.reason as string | undefined;
  if (!decision) {
    error(res, 422, 'VALIDATION_ERROR', 'decision is required', {
      fieldErrors: { decision: 'Required' },
    });
    return;
  }
  if (decision === 'APPROVE' && payment.makerUserId === actor.userId) {
    error(res, 403, 'FORBIDDEN', 'A checker cannot approve a payment they created');
    return;
  }
  if ((decision === 'RETURN' || decision === 'REJECT') && !reason) {
    error(res, 422, 'VALIDATION_ERROR', 'Reason is required', {
      fieldErrors: { reason: 'Required' },
    });
    return;
  }
  const next: Record<Decision, PaymentStatus> = {
    APPROVE: 'APPROVED',
    RETURN: 'RETURNED',
    REJECT: 'REJECTED',
  };
  payment.status = next[decision];
  bump(
    payment,
    decision === 'APPROVE' ? 'APPROVED' : decision === 'RETURN' ? 'RETURNED' : 'REJECTED',
    reason,
  );
  const result = writeResult(payment, { decisionBy: actor.userId });
  remember(clientRequestId, 200, result);
  res.json(result);
});

app.post('/api/fx/quote', (req, res) => {
  const { debitAccountId, sourceCurrency, targetCurrency, targetAmount } = req.body ?? {};
  if (!debitAccountId || !sourceCurrency || !targetCurrency || !targetAmount) {
    error(res, 422, 'VALIDATION_ERROR', 'Quote fields are required', {
      fieldErrors: {
        debitAccountId: debitAccountId ? undefined : 'Required',
        sourceCurrency: sourceCurrency ? undefined : 'Required',
        targetCurrency: targetCurrency ? undefined : 'Required',
        targetAmount: targetAmount ? undefined : 'Required',
      },
    });
    return;
  }
  const rate = sourceCurrency === targetCurrency ? 1 : 1.12;
  const quote = {
    quoteId: `fx-${Date.now()}`,
    sourceCurrency,
    targetCurrency,
    rate,
    targetAmount: Number(targetAmount),
    debitAmount: Number((Number(targetAmount) * rate).toFixed(2)),
    expiresAt: new Date(Date.now() + 30_000).toISOString(),
  };
  db.quotes.set(quote.quoteId, quote);
  res.status(201).json(quote);
});

app.post('/api/bulk-payments', (req, res) => {
  const csv = typeof req.body === 'string' ? req.body : String(req.body?.csv ?? '');
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length > 2001) {
    error(res, 422, 'VALIDATION_ERROR', 'Maximum 2,000 data rows');
    return;
  }
  const rejectedRows: Array<{
    row: number;
    clientReference: string;
    code: string;
    message: string;
  }> = [];
  let acceptedRows = 0;
  const dataRows = lines.slice(1);
  dataRows.forEach((line, index) => {
    const cols = line.split(',');
    const clientReference = (cols[0] ?? '').trim();
    if (cols.length < 8 || !cols[5] || Number(cols[5]) <= 0) {
      rejectedRows.push({
        row: index + 2,
        clientReference,
        code: 'INVALID_ROW',
        message: 'Invalid amount or missing columns',
      });
      return;
    }
    acceptedRows += 1;
  });
  res.json({
    batchId: `bulk-${Date.now()}`,
    receivedRows: dataRows.length,
    acceptedRows,
    rejectedRows,
    status: rejectedRows.length ? 'PARTIAL' : 'ACCEPTED',
  });
});

app.use((_req, res) => {
  error(res, 404, 'NOT_FOUND', 'Unknown endpoint');
});

app.listen(PORT, () => {
  console.log(`Mock API listening on http://localhost:${PORT} as ${CURRENT_USER_ID}`);
  console.log(`Loaded ${db.payments.length} payments`);
});
