import { Pipe, PipeTransform } from '@angular/core';
import { PaymentStatus } from '../enums/payment.enums';

const DEFAULT_BADGE = 'bg-canvas text-muted ring-line';

const STATUS_BADGE_CLASSES: Record<PaymentStatus, string> = {
  [PaymentStatus.Draft]: 'bg-state-draft/10 text-state-draft ring-state-draft/30',
  [PaymentStatus.PendingCheck]: 'bg-state-pending/10 text-state-pending ring-state-pending/30',
  [PaymentStatus.Returned]: 'bg-state-returned/10 text-state-returned ring-state-returned/30',
  [PaymentStatus.Approved]: 'bg-state-approved/10 text-state-approved ring-state-approved/30',
  [PaymentStatus.Rejected]: 'bg-state-rejected/10 text-state-rejected ring-state-rejected/30',
  [PaymentStatus.Cancelled]: 'bg-state-cancelled/15 text-state-cancelled ring-state-cancelled/30',
};

@Pipe({
  name: 'statusBadge',
})
export class StatusBadgePipe implements PipeTransform {
  transform(status: string | null | undefined): string {
    if (!status) {
      return DEFAULT_BADGE;
    }
    return STATUS_BADGE_CLASSES[status as PaymentStatus] ?? DEFAULT_BADGE;
  }
}
