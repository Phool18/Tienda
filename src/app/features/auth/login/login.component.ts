// src/app/features/auth/login/login.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card card p-4 p-md-5">

        <!-- Header -->
        <div class="text-center mb-4">
          <div class="brand-icon mb-3">🍰</div>
          <h2 class="fw-bold mb-1">¡Bienvenido!</h2>
          <p class="text-muted">{{ storeName }}</p>
        </div>

        @if (error()) {
          <div class="alert alert-danger d-flex align-items-center rounded-3" role="alert">
            <i class="bi bi-exclamation-circle-fill me-2"></i>
            <span>{{ error() }}</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <label class="form-label fw-semibold">Correo electrónico</label>
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-envelope-heart"></i>
              </span>
              <input
                type="email"
                class="form-control"
                formControlName="email"
                placeholder="ejemplo@correo.com"
                [class.is-invalid]="form.get('email')?.invalid && form.get('email')?.touched"
              >
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label fw-semibold">Contraseña</label>
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-lock-heart"></i>
              </span>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                class="form-control"
                formControlName="password"
                placeholder="Tu contraseña"
              >
              <button class="btn btn-outline-secondary" type="button" (click)="togglePassword()">
                <i class="bi" [class]="showPassword() ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-pastel-primary w-100 py-2 fw-semibold"
            [disabled]="loading()"
          >
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-2"></span>
              Ingresando...
            } @else {
              <i class="bi bi-door-open me-2"></i>Iniciar sesión
            }
          </button>
        </form>

        <hr class="my-4">
        <p class="text-center text-muted mb-0">
          ¿No tienes cuenta?
          <a routerLink="/register" class="link-pastel fw-semibold text-decoration-none">
            Regístrate aquí 🍩
          </a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  storeName    = environment.storeName;
  loading      = signal(false);
  error        = signal('');
  showPassword = signal(false);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const role = await this.auth.login(
        this.form.value.email!,
        this.form.value.password!
      );

      const returnUrl = this.route.snapshot.queryParams['returnUrl'];

      if (role === 'ADMIN') {
        this.router.navigate(['/admin/products'], { replaceUrl: true });
      } else {
        this.router.navigate([returnUrl ?? '/catalog'], { replaceUrl: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      this.error.set('Credenciales incorrectas. Por favor intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}
