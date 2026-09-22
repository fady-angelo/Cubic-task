import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { Direction } from './direction';
import { TableColumn } from './table-column';

@Component({
  selector: 'app-table',
  imports: [NgClass, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table.component.html',
})
export class TableComponent<T> {
  readonly rows = input.required<T[]>();
  readonly columns = input.required<TableColumn[]>();
  readonly sortField = input.required<string>();
  readonly sortDirection = input<Direction | undefined>();
  readonly rowClickable = input(false);
  readonly loading = input(false);
  readonly loadingLabel = input('Loading…');
  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly sort = output<string>();
  readonly rowClick = output<T>();
  readonly rowCells = contentChild.required<TemplateRef<{ $implicit: T }>>('rowCells');

  readonly isEmpty = computed(() => this.rows().length === 0);
  readonly columnCount = computed(() => this.columns().length);
  readonly headerColumns = computed(() => {
    const sortField = this.sortField();
    const sortDirection = this.sortDirection();
    return this.columns().map((column) => {
      const isActive = column.sortable && sortField === column.key;
      return {
        ...column,
        ariaSort: headerAriaSort(isActive, sortDirection),
        sortAscActive: isActive && sortDirection === Direction.Asc,
        sortDescActive: isActive && sortDirection === Direction.Desc,
      };
    });
  });

  selectRow(row: T): void {
    if (this.rowClickable()) {
      this.rowClick.emit(row);
    }
  }
}

function headerAriaSort(
  isActive: boolean,
  direction: Direction | undefined,
): 'ascending' | 'descending' | null {
  if (!isActive) {
    return null;
  }
  return direction === Direction.Asc ? 'ascending' : 'descending';
}
