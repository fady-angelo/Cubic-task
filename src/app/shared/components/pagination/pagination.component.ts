import { DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PageItem } from './pagination';

@Component({
  selector: 'app-pagination',
  imports: [NgClass, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly total = input.required<number>();
  readonly rangeStart = input.required<number>();
  readonly rangeEnd = input.required<number>();
  readonly pageItems = input.required<PageItem[]>();
  readonly itemLabel = input('items');
  readonly goToPage = output<number>();

  readonly isFirstPage = computed(() => this.currentPage() === 1);
  readonly isLastPage = computed(() => this.currentPage() === this.totalPages());
  readonly previousPage = computed(() => this.currentPage() - 1);
  readonly nextPage = computed(() => this.currentPage() + 1);
}
