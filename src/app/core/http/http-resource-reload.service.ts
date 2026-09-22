import { Injectable } from '@angular/core';

export interface ReloadableHttpResource {
  reload(): void;
}

@Injectable({ providedIn: 'root' })
export class HttpResourceReloadService {
  reload(resource: ReloadableHttpResource): void {
    resource.reload();
  }
}
