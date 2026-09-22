import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'payments',
    loadChildren: () =>
      import('./features/payments/payments.routes').then((module) => module.paymentsRoutes),
  },
  { path: '', pathMatch: 'full', redirectTo: 'payments' },
  { path: '**', redirectTo: 'payments' },
];
