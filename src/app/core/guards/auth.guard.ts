// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Espera a que el perfil esté cargado
async function waitForProfile(auth: AuthService): Promise<void> {
  if (auth.isLoggedIn()) return;
  // Esperar máximo 3 segundos
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 100));
    if (auth.profile() !== null || !auth.loading()) return;
  }
}

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  await waitForProfile(auth);

  if (auth.isLoggedIn()) return true;

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const adminGuard: CanActivateFn = async (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  await waitForProfile(auth);

  if (auth.isAdmin()) return true;
  if (auth.isLoggedIn()) {
    router.navigate(['/catalog']);
    return false;
  }
  router.navigate(['/login']);
  return false;
};

export const userGuard: CanActivateFn = async (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  await waitForProfile(auth);

  if (auth.isUser() || auth.isAdmin()) return true;
  router.navigate(['/login']);
  return false;
};

export const noAuthGuard: CanActivateFn = async (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  await waitForProfile(auth);

  if (!auth.isLoggedIn()) return true;

  if (auth.isAdmin()) {
    router.navigate(['/admin/products']);
  } else {
    router.navigate(['/catalog']);
  }
  return false;
};

// ── Bloquear admin de rutas de usuario ────────────────────
export const blockAdminGuard: CanActivateFn = async (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  await waitForProfile(auth);

  if (auth.isAdmin()) {
    router.navigate(['/admin/products']);
    return false;
  }
  return true;
};
