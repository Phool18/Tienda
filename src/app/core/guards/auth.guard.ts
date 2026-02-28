// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const adminGuard: CanActivateFn = (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  if (auth.isLoggedIn()) {
    router.navigate(['/catalog']);
    return false;
  }
  router.navigate(['/login']);
  return false;
};

export const userGuard: CanActivateFn = (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isUser() || auth.isAdmin()) return true;
  router.navigate(['/login']);
  return false;
};

export const noAuthGuard: CanActivateFn = (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  if (auth.isAdmin()) {
    router.navigate(['/admin/products']);
  } else {
    router.navigate(['/catalog']);
  }
  return false;
};

// ── Bloquear admin de rutas de usuario ────────────────────
export const blockAdminGuard: CanActivateFn = (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) {
    router.navigate(['/admin/products']);
    return false;
  }
  return true;
};
