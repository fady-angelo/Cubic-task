# Corporate Banking — Payment Control Center

Operations console for corporate payment initiation, four-eyes approval, and audit. Makers draft and submit single or bulk payments. Checkers approve, return, or reject work they did not create. Auditors review the queue and the event history without mutating it.

The application is an Angular standalone frontend. Reads go through query services and `httpResource`. Writes go through command services. Screen state lives in signals on the component that owns the screen. Shared orchestration lives in a service at the narrowest feature that needs it.

## Overview & Architecture

### Business scope

The Payment Control Center covers the payment lifecycle an operations desk uses every day:

| Surface | Route | Who uses it |
| --- | --- | --- |
| Work queue | `/payments` | Maker, Checker, Auditor |
| New or edit payment | `/payments/new`, `/payments/:id/edit` | Maker |
| Payment detail and decision | `/payments/:id` | Maker (submit/cancel draft), Checker (decide), Auditor (read) |
| Bulk CSV intake | `/payments/bulk` | Maker |

Account numbers stay masked unless the signed-in user holds `VIEW_FULL_ACCOUNT`. Optimistic concurrency uses `rowVersion`. Every mutation carries a `clientRequestId` so a retried request does not create a second payment.

### Architectural principles

**Feature-first layout.** Payment queue, form, detail, and bulk intake each own their pages, components, models, and services. Cross-cutting session, HTTP errors, and guards live under `src/app/core`. Widgets reused by more than one feature (table, pagination, error state, confirm dialog) live under `src/app/shared/components`.

**Signals and `httpResource`.** List and detail reads are `httpResource` GETs. Derived flags (`canApprove`, quote expiry, remaining seconds) are `computed()`. URL query parameters are the source of truth for queue filters, sort, and page, so a refresh or a shared link restores the same slice of work.

**Command and query separation.** `PaymentQueryService` loads payments, accounts, beneficiaries, and reference data. `PaymentCommandService` creates, updates, submits, cancels, and decides. `FxQuoteService` posts quotes. `BulkPaymentCommandService` submits a validated file. Components do not call `HttpClient`.

**Strict TypeScript.** The compiler rejects implicit returns, implicit overrides, fall-through switches, and untyped index access. Angular compilation requires strict injection parameters and strict input modifiers. Public APIs are typed models. DTOs, form values, and write payloads stay distinct and are mapped in `utils/`.

**Change detection and forms.** Components use `OnPush`. Dependencies are field `inject()` calls. Forms are typed reactive forms. Templates bind display models; beneficiary names, remittance text, and audit comments are interpolated as text.

```text
src/app/
  core/          session, guards, functional interceptors, HTTP error model
  shared/        table, pagination, error-state, confirm-dialog
  features/payments/
    queue/       work queue page, filters, table
    form/        stepper, validators, FX quote, write mappers
    details/     payment detail, decisions, audit timeline
    bulk/        CSV intake, worker, validation, windowed rows
    services/    query, command, and FX HTTP
    models/      DTOs and request types
    enums/       status and payment type
```

## Key Features Implemented

### Work queue

The queue requests one server page at a time. Sort direction and column live with the shared table. Free-text search is debounced (300 ms) and written into the URL only after the value settles, so keystrokes do not stampede the API. `httpResource` is keyed to the current query; an older response cannot replace a newer one. Pagination, status, type, and sort survive reload because they are query parameters.

### Multi-step payment form

Create and edit share one stepper: source, beneficiary, payment details, review. Domestic payments omit international fields. International payments require SWIFT/BIC, country, address, and a charge option (SHA, OUR, BEN). Draft save and submit are separate commands. Submit sends the current `rowVersion` with its own `clientRequestId`. Leaving a dirty form is blocked by `unsavedPaymentGuard`. HTTP 422 `fieldErrors` are applied onto the matching form controls. HTTP 409 reloads the latest payment before another write.

### Maker-checker workflow

Roles are `MAKER`, `CHECKER`, and `AUDITOR`. The maker guard blocks create, edit, and bulk routes for everyone else. Checkers see approve, return, and reject on submitted payments. A checker who created the payment cannot decide it. Auditors see the queue and the detail with no mutation controls. Detail actions set an in-progress lock before the HTTP call and clear it when the call settles, so a double click cannot fire a second decision. The mock API enforces the same `rowVersion` check and returns `409 STALE_VERSION` with `currentRowVersion` when the client is behind.

### Cross-currency FX engine

When debit currency and payment currency differ, the form requests a quote through `POST /api/fx/quote`. The quote service keeps the latest in-flight request: `switchMap` drops a superseded response so a slow quote cannot overwrite a newer one. A one-second clock drives a countdown from `expiresAt` (quotes are issued for 30 seconds). Changing the debit account, amount, or either currency invalidates the quote. An expired quote disables submit until the user requests a fresh one.

### Bulk CSV processing

Intake accepts CSV only, up to 5 MB and 2,000 data rows. Parsing and row validation run in a Web Worker so the UI thread stays responsive. Columns are `clientReference`, `beneficiaryName`, `beneficiaryAccount`, `bankCodeOrSwift`, `currency`, `amount`, `executionDate`, and `purposeCode`. Client validation covers required fields, amounts, currencies, execution dates, and duplicate client references. The row list is windowed (fixed row height, overscan) so two thousand rows are not mounted at once. Server `rejectedRows` are merged with client errors before submit is allowed. The bulk command service rejects a second submit while the first is in flight.

### Audit timeline and security

Payment detail renders the audit trail as a timeline of status transitions, actors, and timestamps. Account display uses the masked value unless the session includes `VIEW_FULL_ACCOUNT`, in which case the full IBAN is shown. Beneficiary, remittance, and comment fields are bound as text. The application does not assign those strings to `innerHTML` and does not bypass Angular's HTML sanitizer for them.

The shell can switch the mock session among three makers, one checker, and one auditor so the same payment can be exercised from each side of the control.

## Technical Stack & State Patterns

| Concern | Choice |
| --- | --- |
| UI | Angular 22, standalone components, signals, `OnPush` |
| Language | TypeScript 6, strict compiler and Angular compiler flags |
| Async | RxJS 7 for commands, debounced search, and quote requests |
| Reads | `httpResource` for session, reference data, accounts, beneficiaries, and payments |
| Writes | `HttpClient` in command services only |
| Tests | Vitest via `@angular/build:unit-test` |
| Styles | Tailwind CSS 4 |
| Quality | ESLint (angular-eslint), Prettier |
| Local API | Express mock on port 3000, proxied from `/api` |

### Concurrency and network design

- **Single-flight locks.** Detail decisions refuse a new command while `actionInProgress` is set. Bulk submit returns `ActionInProgressError` if a file upload is already running. Buttons are disabled for the same window; the service or component guard is the real lock.
- **Idempotent `clientRequestId`.** Each user action receives `crypto.randomUUID()` once. The same id is reused only when that action is retried. The mock API caches the first response for an id and replays it.
- **Unified error interceptor.** `errorInterceptor` maps HTTP failures to a typed `AppHttpError`: `401` unauthorized, `403` forbidden, `409` conflict, `422` validation, `500` server. Feature code still handles 409 (reload `rowVersion`) and 422 (field errors). Mutations are not retried automatically.

## Getting Started

### Prerequisites

- Node.js `^22.22.3`, `^24.15.0`, or `>=26` (the range required by Angular CLI 22)
- npm 11 (the repository pins `packageManager` to `npm@11.17.0`)

### Installation

```bash
npm install
```

### Mock API and development server

The UI calls `/api`. `proxy.conf.json` forwards that prefix to `http://127.0.0.1:3000`. `src/environments/environment.ts` sets `baseUrl` to `/api`.

Start the mock API and the dev server together:

```bash
npm run start:mock
```

That runs `tsx watch mock-api/server.ts` and `ng serve` with the proxy. Open `http://localhost:4200`. The app redirects to `/payments`.

Run them separately when you want independent logs:

```bash
npm run mock-api
npm start
```

The mock listens on port 3000. It serves `/api/me`, reference data, accounts, beneficiaries, payments, FX quotes, decisions, and bulk submit, including 409 and 422 responses.

### Production build

```bash
npm run build
```

Output is written by the Angular application builder. The production build still expects an API behind `/api`; point the host or gateway at the real payment service.

## Testing & Quality

Unit tests use Angular `TestBed` and Vitest (`vi.fn`, `vi.spyOn`). Specs sit next to the file they cover. Run the suite once:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Coverage (text plus the reporters enabled by the unit-test builder; HTML lands under `coverage/`):

```bash
npm test -- --coverage
```

Static checks:

```bash
npm run lint
npm run format:check
```

### Critical scenarios covered

- **Maker-checker isolation.** Makers see create and bulk entry. Checkers do not. Auditors have no submit, cancel, approve, return, or reject actions. A checker cannot approve a payment they created. The maker guard blocks `/payments/new`, `/payments/bulk`, and edit routes.
- **409 conflict reload.** A stale `rowVersion` surfaces as a conflict. The form reloads the payment and the next write uses `currentRowVersion`. Detail shows that the payment was updated elsewhere.
- **FX invalidation.** A quote is dropped when amount, account, or currency changes. An expired `expiresAt` blocks submit and offers a new quote. A slower response does not replace the latest request.
- **Bulk CSV parsing.** Non-CSV files and files over the row cap are rejected. Row validators report missing fields, bad amounts, bad dates, and duplicate client references. Server rejects merge into the same summary. A second submit while one is in flight is refused.
- **Account masking.** Selects, review, queue, and detail render the masked account. The full IBAN appears only when `VIEW_FULL_ACCOUNT` is present.
