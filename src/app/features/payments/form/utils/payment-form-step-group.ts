import { PaymentForm } from '../models/payment-form.models';
import { PaymentFormStepId } from '../payment-form.constants';

export function paymentFormGroupForStep(form: PaymentForm, step: PaymentFormStepId) {
  switch (step) {
    case 1:
      return form.controls.source;
    case 2:
      return form.controls.beneficiary;
    case 3:
      return form.controls.payment;
    case 4:
      return null;
  }
}

export function isPaymentFormStepValid(form: PaymentForm, step: PaymentFormStepId): boolean {
  const group = paymentFormGroupForStep(form, step);
  return group?.valid ?? true;
}
