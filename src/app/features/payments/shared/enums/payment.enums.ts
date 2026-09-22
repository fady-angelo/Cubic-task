export enum PaymentStatus {
  Draft = 'DRAFT',
  PendingCheck = 'PENDING_CHECK',
  Returned = 'RETURNED',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Cancelled = 'CANCELLED',
}

export enum PaymentType {
  Domestic = 'DOMESTIC',
  International = 'INTERNATIONAL',
}
