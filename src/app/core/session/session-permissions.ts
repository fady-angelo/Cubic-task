import { PaymentStatus } from '../../features/payments/shared/enums/payment.enums';
import { Entitlement } from './enums/entitlement';
import { UserRole } from './enums/user-role';
import { CurrentUser } from './models/current-user';

export function canCreatePayment(user: CurrentUser | null | undefined): boolean {
  return isMaker(user);
}

export function canUploadBulk(user: CurrentUser | null | undefined): boolean {
  return isMaker(user);
}

export function canMutate(user: CurrentUser | null | undefined): boolean {
  return Boolean(user) && !isAuditor(user);
}

export function canDecidePayment(user: CurrentUser | null | undefined): boolean {
  return isChecker(user);
}

export function canViewFullAccount(user: CurrentUser | null | undefined): boolean {
  return Boolean(user?.entitlements.includes(Entitlement.ViewFullAccount));
}

export function canEditDraftOrReturned(
  user: CurrentUser | null | undefined,
  status: PaymentStatus | string | null | undefined,
): boolean {
  return isMaker(user) && isDraftOrReturned(status);
}

export function canSubmitPayment(
  user: CurrentUser | null | undefined,
  status: PaymentStatus | string | null | undefined,
): boolean {
  return isMaker(user) && isDraftOrReturned(status);
}

export function canCancelOwnDraft(
  user: CurrentUser | null | undefined,
  status: PaymentStatus | string | null | undefined,
  makerUserId: string | null | undefined,
): boolean {
  return isMaker(user) && status === PaymentStatus.Draft && isOwnPayment(user, makerUserId);
}

export function canApprovePayment(
  user: CurrentUser | null | undefined,
  makerUserId: string | null | undefined,
  status: PaymentStatus | string | null | undefined,
): boolean {
  return (
    isChecker(user) && status === PaymentStatus.PendingCheck && !isOwnPayment(user, makerUserId)
  );
}

export function canReturnOrRejectPayment(
  user: CurrentUser | null | undefined,
  status: PaymentStatus | string | null | undefined,
): boolean {
  return isChecker(user) && status === PaymentStatus.PendingCheck;
}

function isMaker(user: CurrentUser | null | undefined): boolean {
  return user?.role.value === UserRole.Maker;
}

function isChecker(user: CurrentUser | null | undefined): boolean {
  return user?.role.value === UserRole.Checker;
}

function isAuditor(user: CurrentUser | null | undefined): boolean {
  return user?.role.value === UserRole.Auditor;
}

function isDraftOrReturned(status: PaymentStatus | string | null | undefined): boolean {
  return status === PaymentStatus.Draft || status === PaymentStatus.Returned;
}

function isOwnPayment(
  user: CurrentUser | null | undefined,
  makerUserId: string | null | undefined,
): boolean {
  return Boolean(user && makerUserId && user.userId === makerUserId);
}
