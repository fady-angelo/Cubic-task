import { TestBed } from '@angular/core/testing';
import { HttpResourceReloadService } from './http-resource-reload.service';

describe('HttpResourceReloadService', () => {
  it('reloads the given HTTP resource', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(HttpResourceReloadService);
    const resource = { reload: vi.fn() };
    service.reload(resource);
    expect(resource.reload).toHaveBeenCalledOnce();
  });
});
