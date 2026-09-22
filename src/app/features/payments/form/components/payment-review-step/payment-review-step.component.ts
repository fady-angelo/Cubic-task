import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FxQuote } from '../../../models/fx-quote.models';
import { PaymentReviewSummary } from '../../models/payment-form.models';

@Component({
  selector: 'app-payment-review-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-review-step.component.html',
})
export class PaymentReviewStepComponent {
  readonly summary = input.required<PaymentReviewSummary>();
  readonly formValid = input(false);
  readonly requiresFxQuote = input(false);
  readonly quote = input<FxQuote | null>(null);
  readonly quoteLoading = input(false);
  readonly quoteError = input<string | null>(null);
  readonly quoteExpired = input(false);
  readonly remainingSeconds = input(0);
  readonly retryQuote = output<void>();
}
