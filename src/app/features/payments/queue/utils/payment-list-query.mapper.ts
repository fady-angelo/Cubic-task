import { ParamMap } from '@angular/router';
import { Direction } from '../../../../shared/components/table/direction';
import { PaymentListQuery } from '../../models/payment-list.models';
import { PaymentStatus, PaymentType } from '../../shared/enums/payment.enums';
import {
  PAYMENT_LIST_DEFAULT_DIR,
  PAYMENT_LIST_DEFAULT_SORT,
  PAYMENT_LIST_PAGE_SIZE,
} from './payment-list-query.constants';

export function mapParamMapToQuery(params: ParamMap): PaymentListQuery {
  const query: PaymentListQuery = {
    page: readPage(params.get('page'), 1),
    pageSize: readPage(params.get('pageSize'), PAYMENT_LIST_PAGE_SIZE),
    sort: params.get('sort') ?? PAYMENT_LIST_DEFAULT_SORT,
    direction: readDirection(params.get('direction')),
    q: params.get('q') ?? undefined,
    status: readEnum(params.get('status'), PaymentStatus),
    type: readEnum(params.get('type'), PaymentType),
    currency: params.get('currency') ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
  };

  return removeUndefinedValues(query);
}

export function queryToParams(query: PaymentListQuery): Record<string, string | number> {
  return removeUndefinedValues({ ...query }) as Record<string, string | number>;
}

function removeUndefinedValues<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T;
}

function readPage(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback;
}

function readDirection(value: string | null): Direction {
  return value === Direction.Asc || value === Direction.Desc ? value : PAYMENT_LIST_DEFAULT_DIR;
}

function readEnum<T extends object>(
  value: string | null | undefined,
  enumObj: T,
): T[keyof T] | undefined {
  if (!value) {
    return undefined;
  }
  const enumValues = Object.values(enumObj) as string[];
  return enumValues.includes(value) ? (value as T[keyof T]) : undefined;
}
