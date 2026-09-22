import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableColumn } from './table-column';
import { TableComponent } from './table.component';

@Component({
  selector: 'app-table-host',
  imports: [TableComponent],
  template: `
    <app-table
      [rows]="rows"
      [columns]="columns"
      sortField="name"
      [loading]="false"
      (sort)="sorted = $event"
    >
      <div dataTableEmpty>Empty</div>
      <ng-template #rowCells let-row>
        <td>{{ row.name }}</td>
      </ng-template>
    </app-table>
  `,
})
class TableHostComponent {
  sorted = '';
  readonly rows = [{ id: '1', name: 'Alpha' }];
  readonly columns: TableColumn[] = [{ key: 'name', label: 'Name', sortable: true }];
}

describe('TableComponent', () => {
  let fixture: ComponentFixture<TableHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TableHostComponent);
    fixture.detectChanges();
  });

  it('emits sort when a sortable header is clicked', () => {
    const button = fixture.nativeElement.querySelector('th button') as HTMLButtonElement;
    button.click();
    expect(fixture.componentInstance.sorted).toBe('name');
  });
});
