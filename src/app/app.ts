import { Component } from '@angular/core';
import { LayoutComponent } from './core/layout/layout.component';

@Component({
  imports: [LayoutComponent],
  selector: 'app-root',
  template: '<app-layout />',
})
export class App {}
