import { LabelValue } from '../../../shared/models/label-value';
import { Entitlement } from '../enums/entitlement';
import { UserRole } from '../enums/user-role';

export interface CurrentUser {
  userId: string;
  displayName: string;
  role: LabelValue<UserRole>;
  branchCode: string;
  entitlements: Entitlement[];
}
