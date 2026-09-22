import { PaymentStatus } from '../enums/payment.enums';
import { StatusBadgePipe } from './status-badge.pipe';

describe('StatusBadgePipe', () => {
  const pipe = new StatusBadgePipe();

  it('maps PENDING_CHECK to the pending state token classes', () => {
    expect(pipe.transform(PaymentStatus.PendingCheck)).toContain('text-state-pending');
  });

  it('maps APPROVED to the approved state token classes', () => {
    expect(pipe.transform(PaymentStatus.Approved)).toContain('text-state-approved');
  });

  it('maps REJECTED to the rejected state token classes', () => {
    expect(pipe.transform(PaymentStatus.Rejected)).toContain('text-state-rejected');
  });

  it('falls back to neutral classes for an unknown status', () => {
    expect(pipe.transform('UNKNOWN')).toContain('text-muted');
  });
});
