import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PaymentAuditEvent } from '../../../models/payment-detail.models';

@Component({
  selector: 'app-payment-audit-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './payment-audit-timeline.component.html',
})
export class PaymentAuditTimelineComponent {
  readonly events = input.required<PaymentAuditEvent[]>();
}
