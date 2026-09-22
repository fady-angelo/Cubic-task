import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentAuditEvent } from '../../../models/payment-detail.models';
import { PaymentAuditTimelineComponent } from './payment-audit-timeline.component';

@Component({
  selector: 'app-payment-audit-timeline-host',
  imports: [PaymentAuditTimelineComponent],
  template: `<app-payment-audit-timeline [events]="events" />`,
})
class HostComponent {
  events: PaymentAuditEvent[] = [
    {
      event: 'CREATED',
      actorId: 'usr-maker-1',
      actorName: 'Sara Malik',
      at: '2026-09-19T18:10:00.000Z',
    },
    {
      event: 'RETURNED',
      actorId: 'usr-checker-1',
      actorName: 'Nora Blake',
      at: '2026-09-20T09:00:00.000Z',
      reason: 'Missing invoice',
    },
  ];
}

describe('PaymentAuditTimelineComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders events with actor, time, and reason as text', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('CREATED');
    expect(text).toContain('Sara Malik');
    expect(text).toContain('Missing invoice');
  });
});
