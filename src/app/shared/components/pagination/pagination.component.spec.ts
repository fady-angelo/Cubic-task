import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.componentRef.setInput('total', 45);
    fixture.componentRef.setInput('rangeStart', 21);
    fixture.componentRef.setInput('rangeEnd', 40);
    fixture.componentRef.setInput('pageItems', [1, 2, 3]);
    fixture.detectChanges();
  });

  it('emits goToPage when a page button is clicked', () => {
    const goToPage = vi.fn();
    fixture.componentInstance.goToPage.subscribe(goToPage);
    const pageOne = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '1',
    );
    pageOne?.click();
    expect(goToPage).toHaveBeenCalledWith(1);
  });
});
