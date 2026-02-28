// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard, userGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/catalog', pathMatch: 'full' },

  // ── Rutas públicas (si ya está logueado lo redirige) ───
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

  // ── Rutas de usuario ───────────────────────────────────
  {
    path: 'catalog',
    canActivate: [authGuard, userGuard],
    loadComponent: () =>
      import('./features/user/catalog/catalog.component').then(c => c.CatalogComponent)
  },
  {
    path: 'cart',
    canActivate: [authGuard, userGuard],
    loadComponent: () =>
      import('./features/user/cart/cart.component').then(c => c.CartComponent)
  },
  {
    path: 'my-orders',
    canActivate: [authGuard, userGuard],
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

  { path: '**', redirectTo: '/catalog' }
];
