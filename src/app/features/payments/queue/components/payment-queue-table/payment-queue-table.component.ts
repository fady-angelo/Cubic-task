import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Direction } from '../../../../../shared/components/table/direction';
import { TableColumn } from '../../../../../shared/components/table/table-column';
import { TableComponent } from '../../../../../shared/components/table/table.component';
import { PaymentSummary } from '../../../models/payment-list.models';
import { StatusBadgePipe } from '../../../shared/pipes/status-badge.pipe';

@Component({
  selector: 'app-payment-queue-table',
  imports: [NgClass, DecimalPipe, DatePipe, RouterLink, TableComponent, StatusBadgePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-queue-table.component.html',
})
export class PaymentQueueTableComponent {
  readonly payments = input.required<PaymentSummary[]>();
  readonly columns = input.required<TableColumn[]>();
  readonly sortField = input.required<string>();
  readonly sortDirection = input<Direction | undefined>();
  readonly loading = input(false);
  readonly sort = output<string>();
  readonly openPayment = output<string>();
}
