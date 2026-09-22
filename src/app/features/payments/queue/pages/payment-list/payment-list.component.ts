import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { messageFromError } from '../../../../../core/errors/message-from-error';
import { HttpResourceReloadService } from '../../../../../core/http/http-resource-reload.service';
import { UserRole } from '../../../../../core/session/enums/user-role';
import { canCreatePayment, canUploadBulk } from '../../../../../core/session/session-permissions';
import { SessionQueryService } from '../../../../../core/session/session-query.service';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import {
  isValidPage,
  pageItems,
  rangeEnd,
  rangeStart,
  totalPages,
} from '../../../../../shared/components/pagination/pagination';
import { Direction } from '../../../../../shared/components/table/direction';
import { PaymentQueryService } from '../../../services/payment-query.service';
import { ReferenceDataService } from '../../../services/reference-data.service';
import { mapParamMapToQuery } from '../../utils/payment-list-query.mapper';
import {
  PaymentQueueFilterForm,
  PaymentQueueFiltersComponent,
} from '../../components/payment-queue-filters/payment-queue-filters.component';
import { PaymentQueueTableComponent } from '../../components/payment-queue-table/payment-queue-table.component';
import { PAYMENT_LIST_COLUMNS, PAYMENT_LIST_DEBOUNCE_MS } from '../../payment-list.constants';

@Component({
  selector: 'app-payment-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PaymentQueueFiltersComponent,
    ErrorStateComponent,
    PaymentQueueTableComponent,
    PaginationComponent,
  ],
  templateUrl: './payment-list.component.html',
})
export class PaymentListComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly paymentQuery = inject(PaymentQueryService);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly sessionQuery = inject(SessionQueryService);
  private readonly httpResourceReload = inject(HttpResourceReloadService);

  private readonly paramMap = toSignal(this.route.queryParamMap, { requireSync: true });
  private readonly paymentListQuery = computed(() => mapParamMapToQuery(this.paramMap()));
  private readonly paymentListResource = this.paymentQuery.getPaymentListResource(() =>
    this.paymentListQuery(),
  );
  private readonly referenceResource = this.referenceData.getReferenceDataResource();
  private readonly currentUser = computed(() => this.sessionQuery.user());

  readonly payments = computed(() => this.paymentListResource.value()?.items ?? []);
  readonly total = computed(() => this.paymentListResource.value()?.total ?? 0);
  readonly loading = computed(() => this.paymentListResource.isLoading());
  readonly errorMessage = computed(() => messageFromError(this.paymentListResource.error()));
  readonly sortField = computed(() => this.paymentListQuery().sort ?? 'createdAt');
  readonly sortDirection = computed(() => this.paymentListQuery().direction);
  readonly currentPage = computed(() => this.paymentListQuery().page);
  private readonly pageSize = computed(() => this.paymentListQuery().pageSize);
  readonly totalPages = computed(() => totalPages(this.total(), this.pageSize()));
  readonly pageItems = computed(() => pageItems(this.currentPage(), this.totalPages()));
  readonly rangeStart = computed(() => rangeStart(this.currentPage(), this.pageSize()));
  readonly rangeEnd = computed(() => rangeEnd(this.currentPage(), this.pageSize(), this.total()));
  readonly showPagination = computed(() => !this.loading() && this.total() > 0);
  readonly hasFilterValues = computed(() => {
    const paymentListQuery = this.paymentListQuery();
    return Boolean(
      paymentListQuery.q ||
      paymentListQuery.status ||
      paymentListQuery.type ||
      paymentListQuery.currency ||
      paymentListQuery.dateFrom ||
      paymentListQuery.dateTo,
    );
  });
  readonly canCreatePayment = computed(() => canCreatePayment(this.currentUser()));
  readonly canUploadBulk = computed(() => canUploadBulk(this.currentUser()));
  readonly queueDescription = computed(() =>
    queueDescriptionForRole(this.currentUser()?.role.value),
  );

  readonly columns = PAYMENT_LIST_COLUMNS;
  readonly statusOptions = computed(() => this.referenceResource.value()?.paymentStatuses ?? []);
  readonly typeOptions = computed(() => this.referenceResource.value()?.paymentTypes ?? []);
  readonly filterForm = this.createFilterForm();

  sort(field: string): void {
    const direction =
      this.sortField() === field && this.sortDirection() === Direction.Asc
        ? Direction.Desc
        : Direction.Asc;
    this.writePaymentListQuery({ sort: field, direction, page: 1 });
  }

  goToPage(page: number): void {
    if (!isValidPage(page, this.totalPages())) {
      return;
    }
    this.writePaymentListQuery({ page });
  }

  retry(): void {
    this.httpResourceReload.reload(this.paymentListResource);
  }

  openPayment(id: string): void {
    void this.router.navigate(['/payments', id]);
  }

  private createFilterForm(): PaymentQueueFilterForm {
    const params = this.paramMap();
    const form = this.formBuilder.nonNullable.group({
      search: [params.get('q') ?? ''],
      status: [params.get('status') ?? ''],
      type: [params.get('type') ?? ''],
      currency: [params.get('currency') ?? ''],
      dateFrom: [params.get('dateFrom') ?? ''],
      dateTo: [params.get('dateTo') ?? ''],
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      form.patchValue(
        {
          search: query.get('q') ?? '',
          status: query.get('status') ?? '',
          type: query.get('type') ?? '',
          currency: query.get('currency') ?? '',
          dateFrom: query.get('dateFrom') ?? '',
          dateTo: query.get('dateTo') ?? '',
        },
        { emitEvent: false },
      );
    });

    form.controls.search.valueChanges
      .pipe(debounceTime(PAYMENT_LIST_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.writePaymentListQuery({ page: 1 }));

    (['status', 'type', 'currency', 'dateFrom', 'dateTo'] as const).forEach((field) => {
      form.controls[field].valueChanges
        .pipe(distinctUntilChanged(), takeUntilDestroyed())
        .subscribe(() => this.writePaymentListQuery({ page: 1 }));
    });

    return form;
  }

  private writePaymentListQuery(
    overrides: Partial<{ page: number; sort: string; direction: Direction }>,
  ): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: overrides.page ?? this.currentPage(),
        pageSize: this.pageSize(),
        sort: overrides.sort ?? this.sortField(),
        direction: overrides.direction ?? this.sortDirection(),
        q: this.filterForm.controls.search.value || null,
        status: this.filterForm.controls.status.value || null,
        type: this.filterForm.controls.type.value || null,
        currency: this.filterForm.controls.currency.value || null,
        dateFrom: this.filterForm.controls.dateFrom.value || null,
        dateTo: this.filterForm.controls.dateTo.value || null,
      },
    });
  }
}

function queueDescriptionForRole(role: UserRole | undefined): string {
  if (role === UserRole.Checker) {
    return 'Review submitted payments. Open a row to approve, return, or reject. You cannot approve a payment you created.';
  }
  if (role === UserRole.Auditor) {
    return 'View-only access. Open a row for payment details and audit history.';
  }
  return 'Filter, sort, and page through payments. Open a row to view details.';
}
