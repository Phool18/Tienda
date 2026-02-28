// src/app/features/auth/register/register.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

// ── Validadores personalizados ─────────────────────────────

// Nombre: mínimo 2 palabras, solo letras y espacios
function fullNameValidator(ctrl: AbstractControl): ValidationErrors | null {
  const value = (ctrl.value ?? '').trim();
  if (!value) return null; // required lo maneja otro validator
  const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value);
  const dospalabras = value.split(/\s+/).filter((w: string) => w.length > 0).length >= 2;
  if (!soloLetras) return { nombreSoloLetras: true };
  if (!dospalabras) return { nombreIncompleto: true };
  return null;
}

// Teléfono peruano: exactamente 9 dígitos, inicia con 9
function phoneValidator(ctrl: AbstractControl): ValidationErrors | null {
  const value = (ctrl.value ?? '').replace(/\s/g, '');
  if (!value) return null; // required lo maneja otro validator
  if (!/^\d+$/.test(value))   return { telefonoSoloDigitos: true };
  if (value.length !== 9)     return { telefonoLongitud: true };
  if (!value.startsWith('9')) return { telefonoInicio: true };
  return null;
}

// Correo: formato válido + dominios comunes permitidos
function emailValidator(ctrl: AbstractControl): ValidationErrors | null {
  const value = (ctrl.value ?? '').trim().toLowerCase();
  if (!value) return null;
  const formatoValido = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value);
  if (!formatoValido) return { emailFormato: true };
  // Bloquear dominios temporales comunes
  const bloqueados = ['mailinator.com','tempmail.com','guerrillamail.com','yopmail.com','trashmail.com'];
  const dominio = value.split('@')[1];
  if (bloqueados.includes(dominio)) return { emailDominioInvalido: true };
  return null;
}

// Contraseña: mínimo 8 caracteres, al menos 1 número y 1 letra
function passwordStrengthValidator(ctrl: AbstractControl): ValidationErrors | null {
  const value = ctrl.value ?? '';
  if (!value) return null;
  if (value.length < 8)          return { passwordCorta: true };
  if (!/[a-zA-Z]/.test(value))   return { passwordSinLetras: true };
  if (!/[0-9]/.test(value))      return { passwordSinNumeros: true };
  return null;
}

// Confirmar contraseña igual
function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const pass    = ctrl.get('password');
  const confirm = ctrl.get('confirmPassword');
  if (pass && confirm && pass.value && confirm.value && pass.value !== confirm.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card card p-4 p-md-5">

        <!-- Header -->
        <div class="text-center mb-4">
          <div class="brand-icon">🧁</div>
          <h2 class="fw-bold text-dark mt-1 mb-1">Crear cuenta</h2>
          <p class="text-muted">{{ storeName }}</p>
        </div>

        @if (error()) {
          <div class="alert alert-danger d-flex align-items-center rounded-3">
            <i class="bi bi-exclamation-circle-fill me-2 flex-shrink-0"></i>
            <span>{{ error() }}</span>
          </div>
        }

        @if (success()) {
          <div class="alert alert-success d-flex align-items-center rounded-3">
            <i class="bi bi-check-circle-fill me-2 flex-shrink-0"></i>
            <span>¡Cuenta creada correctamente! Redirigiendo... 🍰</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

          <!-- Nombre completo -->
          <div class="mb-3">
            <label class="form-label fw-semibold">
              Nombre completo <span class="text-danger">*</span>
            </label>
            <div class="input-group">
              <span class="input-group-text">👤</span>
              <input
                type="text"
                class="form-control"
                formControlName="fullName"
                placeholder="Ej: María García López"
                [class.is-invalid]="isInvalid('fullName')"
                [class.is-valid]="isValid('fullName')"
                maxlength="80"
              >
            </div>
            @if (isInvalid('fullName')) {
              <div class="invalid-feedback d-block">
                @if (getError('fullName', 'required'))        { Ingresa tu nombre completo }
                @else if (getError('fullName', 'minlength'))  { Mínimo 3 caracteres }
                @else if (getError('fullName', 'nombreSoloLetras'))  { Solo se permiten letras y espacios }
                @else if (getError('fullName', 'nombreIncompleto'))  { Ingresa nombre y apellido }
              </div>
            }
            <div class="form-text text-muted small">Solo letras, mínimo nombre y apellido</div>
          </div>

          <!-- Teléfono -->
          <div class="mb-3">
            <label class="form-label fw-semibold">
              Teléfono / WhatsApp <span class="text-danger">*</span>
            </label>
            <div class="input-group">
              <span class="input-group-text">🇵🇪 +51</span>
              <input
                type="tel"
                class="form-control"
                formControlName="phone"
                placeholder="987 654 321"
                [class.is-invalid]="isInvalid('phone')"
                [class.is-valid]="isValid('phone')"
                maxlength="9"
                (input)="onlyNumbers($event)"
              >
            </div>
            @if (isInvalid('phone')) {
              <div class="invalid-feedback d-block">
                @if (getError('phone', 'required'))              { El teléfono es requerido }
                @else if (getError('phone', 'telefonoSoloDigitos')) { Solo se permiten números }
                @else if (getError('phone', 'telefonoInicio'))   { El número debe iniciar con 9 }
                @else if (getError('phone', 'telefonoLongitud')) { Debe tener exactamente 9 dígitos }
                @else if (getError('phone', 'telefonoDuplicado')) { Este número ya está registrado en otra cuenta }
              </div>
            }
            <div class="form-text text-muted small">9 dígitos, inicia con 9 (ej: 987654321)</div>
          </div>

          <!-- Email -->
          <div class="mb-3">
            <label class="form-label fw-semibold">
              Correo electrónico <span class="text-danger">*</span>
            </label>
            <div class="input-group">
              <span class="input-group-text">✉️</span>
              <input
                type="email"
                class="form-control"
                formControlName="email"
                placeholder="ejemplo@correo.com"
                [class.is-invalid]="isInvalid('email')"
                [class.is-valid]="isValid('email')"
                maxlength="100"
              >
            </div>
            @if (isInvalid('email')) {
              <div class="invalid-feedback d-block">
                @if (getError('email', 'required'))                 { El correo es requerido }
                @else if (getError('email', 'emailFormato'))        { Ingresa un correo válido (ej: nombre&#64;gmail.com) }
                @else if (getError('email', 'emailDominioInvalido')){ No se permiten correos temporales }
                @else if (getError('email', 'emailDuplicado')) { Este correo ya está registrado. ¿Olvidaste tu contraseña? }
              </div>
            }
          </div>

          <!-- Contraseña -->
          <div class="mb-3">
            <label class="form-label fw-semibold">
              Contraseña <span class="text-danger">*</span>
            </label>
            <div class="input-group">
              <span class="input-group-text">🔒</span>
              <input
                [type]="showPass() ? 'text' : 'password'"
                class="form-control"
                formControlName="password"
                placeholder="Mínimo 8 caracteres con letras y números"
                [class.is-invalid]="isInvalid('password')"
                [class.is-valid]="isValid('password')"
                maxlength="50"
              >
              <button class="btn btn-outline-secondary" type="button" (click)="togglePass()">
                <i class="bi" [class]="showPass() ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
            @if (isInvalid('password')) {
              <div class="invalid-feedback d-block">
                @if (getError('password', 'required'))           { La contraseña es requerida }
                @else if (getError('password', 'passwordCorta')) { Mínimo 8 caracteres }
                @else if (getError('password', 'passwordSinLetras'))  { Debe contener al menos una letra }
                @else if (getError('password', 'passwordSinNumeros')) { Debe contener al menos un número }
              </div>
            }

            <!-- Indicador de fortaleza -->
            @if (form.get('password')?.value) {
              <div class="mt-2">
                <div class="d-flex gap-1 mb-1">
                  @for (n of [1,2,3,4]; track n) {
                    <div
                      class="flex-grow-1 rounded"
                      style="height:4px;transition:background 0.3s"
                      [style.background]="n <= passwordStrength() ? strengthColor() : '#e2e8f0'"
                    ></div>
                  }
                </div>
                <small [style.color]="strengthColor()">{{ strengthLabel() }}</small>
              </div>
            }
          </div>

          <!-- Confirmar contraseña -->
          <div class="mb-4">
            <label class="form-label fw-semibold">
              Confirmar contraseña <span class="text-danger">*</span>
            </label>
            <div class="input-group">
              <span class="input-group-text">🔒</span>
              <input
                [type]="showPass() ? 'text' : 'password'"
                class="form-control"
                formControlName="confirmPassword"
                placeholder="Repite tu contraseña"
                [class.is-invalid]="form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched"
                [class.is-valid]="form.get('confirmPassword')?.touched && !form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.value"
                maxlength="50"
              >
            </div>
            @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
              <div class="invalid-feedback d-block">Las contraseñas no coinciden</div>
            }
          </div>

          <!-- Términos -->
          <div class="mb-4">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                formControlName="terms"
                id="terms"
                [class.is-invalid]="isInvalid('terms')"
              >
              <label class="form-check-label small" for="terms">
                Acepto los <span class="link-pastel fw-semibold" style="cursor:pointer">términos y condiciones</span>
                y la política de privacidad
              </label>
              @if (isInvalid('terms')) {
                <div class="invalid-feedback d-block">Debes aceptar los términos para continuar</div>
              }
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-pastel-primary w-100 py-2 fw-semibold"
            [disabled]="loading()"
          >
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-2"></span>
              Creando cuenta...
            } @else {
              <i class="bi bi-person-check me-2"></i>Registrarme 🍩
            }
          </button>
        </form>

        <hr class="my-4">
        <p class="text-center text-muted mb-0">
          ¿Ya tienes cuenta?
          <a routerLink="/login" class="link-pastel fw-semibold text-decoration-none">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  storeName = environment.storeName;
  loading   = signal(false);
  error     = signal('');
  success   = signal(false);
  showPass  = signal(false);

  form = this.fb.group({
    fullName:        ['', [Validators.required, Validators.minLength(3), fullNameValidator]],
    phone:           ['', [Validators.required, phoneValidator]],
    email:           ['', [Validators.required, emailValidator]],
    password:        ['', [Validators.required, passwordStrengthValidator]],
    confirmPassword: ['', Validators.required],
    terms:           [false, Validators.requiredTrue]
  }, { validators: passwordMatchValidator });

  togglePass() { this.showPass.update(v => !v); }

  // Permite solo números en el campo teléfono
  onlyNumbers(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
    this.form.get('phone')?.setValue(input.value, { emitEvent: false });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  isValid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.valid && ctrl.touched && ctrl.value);
  }

  getError(field: string, error: string): boolean {
    return !!this.form.get(field)?.hasError(error);
  }

  // ── Indicador de fortaleza de contraseña ──────────────
  passwordStrength(): number {
    const val = this.form.get('password')?.value ?? '';
    let score = 0;
    if (val.length >= 8)                        score++;
    if (val.length >= 12)                       score++;
    if (/[A-Z]/.test(val))                      score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) score++;
    return Math.max(1, Math.min(4, score));
  }

  strengthColor(): string {
    const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
    return colors[this.passwordStrength()];
  }

  strengthLabel(): string {
    const labels = ['', 'Muy débil', 'Débil', 'Buena', 'Muy segura'];
    return labels[this.passwordStrength()];
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const { fullName, email, password, phone } = this.form.value;
      await this.auth.register(email!, password!, fullName!.trim(), phone ?? '');
      this.success.set(true);
      setTimeout(() => this.router.navigate(['/catalog']), 2000);
    } catch (err: any) {
      if (err?.message === 'EMAIL_EXISTS' || err?.message?.toLowerCase().includes('already registered')) {
        this.form.get('email')?.setErrors({ emailDuplicado: true });
        this.form.get('email')?.markAsTouched();
      } else if (err?.message === 'PHONE_EXISTS') {
        this.form.get('phone')?.setErrors({ telefonoDuplicado: true });
        this.form.get('phone')?.markAsTouched();
      } else {
        this.error.set(err?.message ?? 'Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
