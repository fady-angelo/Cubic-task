import { convertToParamMap } from '@angular/router';
import { Direction } from '../../../../shared/components/table/direction';
import { PaymentStatus, PaymentType } from '../../shared/enums/payment.enums';
import { mapParamMapToQuery, queryToParams } from './payment-list-query.mapper';

describe('payment list query mapper', () => {
  it('maps an empty URL to list defaults', () => {
    const query = mapParamMapToQuery(convertToParamMap({}));
    expect(query).toEqual({
      page: 1,
      pageSize: 20,
      sort: 'createdAt',
      direction: Direction.Desc,
    });
  });

  it('round-trips free-text search q', () => {
    const query = mapParamMapToQuery(convertToParamMap({ q: 'acme' }));
    expect(query.q).toBe('acme');
    expect(queryToParams(query)['q']).toBe('acme');
  });

  it('maps filters, page, and sort from the URL', () => {
    const query = mapParamMapToQuery(
      convertToParamMap({
        page: '2',
        pageSize: '20',
        sort: 'amount',
        direction: Direction.Asc,
        status: PaymentStatus.Draft,
        type: PaymentType.Domestic,
        currency: 'EUR',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      }),
    );
    expect(query.page).toBe(2);
    expect(query.sort).toBe('amount');
    expect(query.direction).toBe(Direction.Asc);
    expect(query.status).toBe(PaymentStatus.Draft);
    expect(query.type).toBe(PaymentType.Domestic);
    expect(query.currency).toBe('EUR');
    expect(query.dateFrom).toBe('2026-01-01');
    expect(query.dateTo).toBe('2026-01-31');
  });

  it('omits empty filters from HTTP params', () => {
    expect(queryToParams({ page: 1, pageSize: 20, q: 'acme' })).toEqual({
      page: 1,
      pageSize: 20,
      q: 'acme',
    });
  });

  it('always sends page and pageSize so the client never asks for the full dataset', () => {
    const params = queryToParams(mapParamMapToQuery(convertToParamMap({})));
    expect(params['page']).toBe(1);
    expect(params['pageSize']).toBe(20);
  });

  it('clamps invalid page values to 1', () => {
    expect(mapParamMapToQuery(convertToParamMap({ page: '0' })).page).toBe(1);
    expect(mapParamMapToQuery(convertToParamMap({ page: 'abc' })).page).toBe(1);
  });

  it('drops unknown status and type values', () => {
    const query = mapParamMapToQuery(
      convertToParamMap({ status: 'NOT_A_STATUS', type: 'NOT_A_TYPE' }),
    );
    expect(query.status).toBeUndefined();
    expect(query.type).toBeUndefined();
  });
});
