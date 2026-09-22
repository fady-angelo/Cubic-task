import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  BULK_ROW_ITEM_HEIGHT_PX,
  BULK_ROW_OVERSCAN,
  BULK_ROW_VIEWPORT_HEIGHT_PX,
} from '../../bulk-payment.constants';
import { BulkValidatedRow } from '../../models/bulk-payment.models';
import { windowedRange } from '../../utils/windowed-range';

@Component({
  selector: 'app-bulk-row-viewport',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bulk-row-viewport.component.html',
})
export class BulkRowViewportComponent {
  readonly rows = input.required<BulkValidatedRow[]>();
  readonly itemHeight = BULK_ROW_ITEM_HEIGHT_PX;
  readonly viewportHeight = BULK_ROW_VIEWPORT_HEIGHT_PX;

  private readonly scrollTop = signal(0);

  readonly totalHeight = computed(() => this.rows().length * this.itemHeight);
  readonly range = computed(() =>
    windowedRange(
      this.rows().length,
      this.scrollTop(),
      this.itemHeight,
      this.viewportHeight,
      BULK_ROW_OVERSCAN,
    ),
  );
  readonly windowRows = computed(() => {
    const range = this.range();
    return this.rows().slice(range.start, range.end);
  });

  onScroll(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLElement) {
      this.scrollTop.set(target.scrollTop);
    }
  }

  rowMessages(row: BulkValidatedRow): string {
    if (row.errors.length === 0) {
      return 'No local errors';
    }
    return row.errors.map((error) => formatError(error.message, error.source)).join(' ');
  }
}

function formatError(message: string, source: string | undefined): string {
  return source === 'server' ? `Server: ${message}` : message;
}
