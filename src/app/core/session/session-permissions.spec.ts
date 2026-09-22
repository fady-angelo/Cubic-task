import { PaymentStatus } from '../../features/payments/shared/enums/payment.enums';
import { Entitlement } from './enums/entitlement';
import { UserRole } from './enums/user-role';
import { CurrentUser } from './models/current-user';
import {
  canApprovePayment,
  canCancelOwnDraft,
  canCreatePayment,
  canDecidePayment,
  canEditDraftOrReturned,
  canMutate,
  canReturnOrRejectPayment,
  canSubmitPayment,
  canUploadBulk,
  canViewFullAccount,
} from './session-permissions';

describe('session-permissions', () => {
  const maker = user('usr-maker-1', UserRole.Maker);
  const checker = user('usr-checker-1', UserRole.Checker, [Entitlement.ViewFullAccount]);
  const auditor = user('usr-auditor-1', UserRole.Auditor);

  it('treats a missing user as having no permissions', () => {
    expect(canCreatePayment(null)).toBe(false);
    expect(canUploadBulk(undefined)).toBe(false);
    expect(canMutate(null)).toBe(false);
    expect(canDecidePayment(null)).toBe(false);
    expect(canViewFullAccount(null)).toBe(false);
    expect(canEditDraftOrReturned(null, PaymentStatus.Draft)).toBe(false);
    expect(canSubmitPayment(null, PaymentStatus.Draft)).toBe(false);
    expect(canCancelOwnDraft(null, PaymentStatus.Draft, 'usr-maker-1')).toBe(false);
    expect(canApprovePayment(null, 'usr-maker-1', PaymentStatus.PendingCheck)).toBe(false);
  });

  it('lets a Maker create, bulk-upload, edit, submit, and cancel own drafts', () => {
    expect(canCreatePayment(maker)).toBe(true);
    expect(canUploadBulk(maker)).toBe(true);
    expect(canMutate(maker)).toBe(true);
    expect(canEditDraftOrReturned(maker, PaymentStatus.Draft)).toBe(true);
    expect(canEditDraftOrReturned(maker, PaymentStatus.Returned)).toBe(true);
    expect(canSubmitPayment(maker, PaymentStatus.Draft)).toBe(true);
    expect(canCancelOwnDraft(maker, PaymentStatus.Draft, maker.userId)).toBe(true);
  });

  it('blocks Maker actions that are not draft/returned or not own', () => {
    expect(canEditDraftOrReturned(maker, PaymentStatus.PendingCheck)).toBe(false);
    expect(canSubmitPayment(maker, PaymentStatus.Approved)).toBe(false);
    expect(canCancelOwnDraft(maker, PaymentStatus.Returned, maker.userId)).toBe(false);
    expect(canCancelOwnDraft(maker, PaymentStatus.Draft, 'usr-maker-2')).toBe(false);
    expect(canDecidePayment(maker)).toBe(false);
    expect(canApprovePayment(maker, 'usr-maker-2', PaymentStatus.PendingCheck)).toBe(false);
    expect(canViewFullAccount(maker)).toBe(false);
  });

  it('lets a Checker decide payments but not create, bulk-upload, or self-approve', () => {
    expect(canDecidePayment(checker)).toBe(true);
    expect(canMutate(checker)).toBe(true);
    expect(canViewFullAccount(checker)).toBe(true);
    expect(canApprovePayment(checker, maker.userId, PaymentStatus.PendingCheck)).toBe(true);
    expect(canReturnOrRejectPayment(checker, PaymentStatus.PendingCheck)).toBe(true);
    expect(canReturnOrRejectPayment(checker, PaymentStatus.Draft)).toBe(false);
    expect(canApprovePayment(checker, checker.userId, PaymentStatus.PendingCheck)).toBe(false);
    expect(canReturnOrRejectPayment(checker, PaymentStatus.PendingCheck)).toBe(true);
    expect(canApprovePayment(checker, maker.userId, PaymentStatus.Draft)).toBe(false);
    expect(canCreatePayment(checker)).toBe(false);
    expect(canUploadBulk(checker)).toBe(false);
    expect(canEditDraftOrReturned(checker, PaymentStatus.Draft)).toBe(false);
    expect(canSubmitPayment(checker, PaymentStatus.Draft)).toBe(false);
    expect(canCancelOwnDraft(checker, PaymentStatus.Draft, checker.userId)).toBe(false);
  });

  it('gives an Auditor view-only access with no mutations', () => {
    expect(canMutate(auditor)).toBe(false);
    expect(canCreatePayment(auditor)).toBe(false);
    expect(canUploadBulk(auditor)).toBe(false);
    expect(canEditDraftOrReturned(auditor, PaymentStatus.Draft)).toBe(false);
    expect(canSubmitPayment(auditor, PaymentStatus.Draft)).toBe(false);
    expect(canCancelOwnDraft(auditor, PaymentStatus.Draft, auditor.userId)).toBe(false);
    expect(canDecidePayment(auditor)).toBe(false);
    expect(canReturnOrRejectPayment(auditor, PaymentStatus.PendingCheck)).toBe(false);
    expect(canApprovePayment(auditor, maker.userId, PaymentStatus.PendingCheck)).toBe(false);
    expect(canViewFullAccount(auditor)).toBe(false);
  });
});

function user(userId: string, role: UserRole, entitlements: Entitlement[] = []): CurrentUser {
  return {
    userId,
    displayName: userId,
    role: { value: role, label: roleLabel(role) },
    branchCode: 'LON1',
    entitlements,
  };
}

function roleLabel(role: UserRole): string {
  if (role === UserRole.Maker) {
    return 'Maker';
  }
  if (role === UserRole.Checker) {
    return 'Checker';
  }
  return 'Auditor';
}
