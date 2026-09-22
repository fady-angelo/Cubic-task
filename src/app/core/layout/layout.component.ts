import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionQueryService } from '../session/session-query.service';
import { SESSION_SWITCH_USERS } from '../session/session-switch-users';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  private readonly sessionQuery = inject(SessionQueryService);

  readonly switchUsers = SESSION_SWITCH_USERS;
  readonly sessionLoading = computed(() => this.sessionQuery.currentUser.isLoading());
  readonly selectedUserId = computed(() => this.sessionQuery.user()?.userId ?? '');

  readonly session = computed(() => {
    const user = this.sessionQuery.user();
    if (!user) {
      return null;
    }
    return {
      displayName: user.displayName,
      initials: initialsFor(user.displayName),
      roleLabel: user.role.label,
      branchCode: user.branchCode,
    };
  });

  switchUser(event: Event): void {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement) || !select.value) {
      return;
    }
    this.sessionQuery.switchUser(select.value);
  }
}

function initialsFor(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
