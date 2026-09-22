import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BulkValidationSummary } from '../../models/bulk-payment.models';

@Component({
  selector: 'app-bulk-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bulk-summary.component.html',
})
export class BulkSummaryComponent {
  readonly fileName = input.required<string>();
  readonly summary = input.required<BulkValidationSummary>();
  readonly invalidOnly = input.required<boolean>();
  readonly invalidOnlyChange = output<boolean>();

  readonly amountLabel = computed(() =>
    this.summary()
      .amountByCurrency.map((item) => `${item.currency} ${item.amount}`)
      .join(' · '),
  );
}
