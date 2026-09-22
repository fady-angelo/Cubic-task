import { httpResource } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CurrentUser } from './models/current-user';

@Injectable({ providedIn: 'root' })
export class SessionQueryService {
  private readonly impersonateUserId = signal<string | undefined>(undefined);

  readonly currentUser = httpResource<CurrentUser>(() => {
    const actingUserId = this.impersonateUserId();
    return {
      url: `${environment.baseUrl}/me`,
      params: actingUserId ? { actingUserId } : undefined,
    };
  });

  readonly user = computed(() => {
    const resource = this.currentUser;
    if (resource.error() || !resource.hasValue()) {
      return null;
    }
    return resource.value();
  });

  switchUser(userId: string): void {
    this.impersonateUserId.set(userId);
  }
}
