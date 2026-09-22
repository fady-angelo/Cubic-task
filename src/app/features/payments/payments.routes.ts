import { Routes } from '@angular/router';
import { makerGuard } from '../../core/guards/maker.guard';
import { unsavedPaymentGuard } from './form/guards/unsaved-payment.guard';

export const paymentsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./queue/pages/payment-list/payment-list.component').then(
        (module) => module.PaymentListComponent,
      ),
    title: 'Payment Work Queue',
  },
  {
    path: 'new',
    canActivate: [makerGuard],
    canDeactivate: [unsavedPaymentGuard],
    loadComponent: () =>
      import('./form/pages/payment-form/payment-form.component').then(
        (module) => module.PaymentFormComponent,
      ),
    title: 'New payment',
  },
  {
    path: 'bulk',
    canActivate: [makerGuard],
    loadComponent: () =>
      import('./bulk/pages/bulk-payment/bulk-payment-page.component').then(
        (module) => module.BulkPaymentPageComponent,
      ),
    title: 'Bulk payments',
  },
  {
    path: ':id/edit',
    canActivate: [makerGuard],
    canDeactivate: [unsavedPaymentGuard],
    loadComponent: () =>
      import('./form/pages/payment-form/payment-form.component').then(
        (module) => module.PaymentFormComponent,
      ),
    title: 'Edit payment',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./details/pages/payment-detail/payment-detail.component').then(
        (module) => module.PaymentDetailComponent,
      ),
    title: 'Payment Details',
  },
];
