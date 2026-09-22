export const PAYMENT_FORM_STEPS = [
  { id: 1, label: 'Source' },
  { id: 2, label: 'Beneficiary' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Review' },
] as const;

export type PaymentFormStepId = 1 | 2 | 3 | 4;

export const FIRST_PAYMENT_FORM_STEP: PaymentFormStepId = 1;
export const LAST_PAYMENT_FORM_STEP: PaymentFormStepId = 4;
