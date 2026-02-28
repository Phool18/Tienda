// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard, blockAdminGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // ── Rutas públicas ─────────────────────────────────────
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(c => c.RegisterComponent)
  },

  // ── Rutas de usuario (admin bloqueado) ─────────────────
  {
    path: 'catalog',
    canActivate: [authGuard, blockAdminGuard],
    loadComponent: () =>
      import('./features/user/catalog/catalog.component').then(c => c.CatalogComponent)
  },
  {
    path: 'cart',
    canActivate: [authGuard, blockAdminGuard],
    loadComponent: () =>
      import('./features/user/cart/cart.component').then(c => c.CartComponent)
  },
  {
    path: 'my-orders',
    canActivate: [authGuard, blockAdminGuard],
    loadComponent: () =>
      import('./features/user/orders/orders.component').then(c => c.OrdersComponent)
  },

  // ── Rutas de administrador ─────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/products/product-list.component').then(c => c.ProductListComponent)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/admin-orders.component').then(c => c.AdminOrdersComponent)
      }
    ]
  },

  { path: '**', redirectTo: '/login' }
];
