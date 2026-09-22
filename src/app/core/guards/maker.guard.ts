import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { canCreatePayment } from '../session/session-permissions';
import { SessionQueryService } from '../session/session-query.service';

export const makerGuard: CanActivateFn = () => {
  const session = inject(SessionQueryService);
  const router = inject(Router);

  return toObservable(session.currentUser.status).pipe(
    filter((status) => status === 'resolved' || status === 'error'),
    take(1),
    map(() => canCreatePayment(session.user()) || router.parseUrl('/payments')),
  );
};
