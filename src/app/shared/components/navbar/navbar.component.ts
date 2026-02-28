// src/app/shared/components/navbar/navbar.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-pastel px-3">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2" routerLink="/">
          <span style="font-size:1.5rem">🍰</span>
          {{ storeName }}
        </a>

        <button class="navbar-toggler border-0" type="button"
          data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navMenu">

          @if (auth.isUser()) {
            <ul class="navbar-nav me-auto gap-1">
              <li class="nav-item">
                <a class="nav-link" routerLink="/catalog" routerLinkActive="active">
                  🧁 Catálogo
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/my-orders" routerLinkActive="active">
                  📦 Mis Pedidos
                </a>
              </li>
            </ul>
          }

          @if (auth.isAdmin()) {
            <ul class="navbar-nav me-auto gap-1">
              <li class="nav-item">
                <a class="nav-link" routerLink="/admin/products" routerLinkActive="active">
                  🍩 Productos
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/admin/orders" routerLinkActive="active">
                  📋 Pedidos
                </a>
              </li>
            </ul>
          }

          <ul class="navbar-nav ms-auto align-items-center gap-2">
            @if (auth.isUser()) {
              <li class="nav-item">
                <a class="nav-link cart-badge" routerLink="/cart">
                  <i class="bi bi-bag-heart fs-5" style="color:#ec4899"></i>
                  @if (cart.totalItems() > 0) {
                    <span class="badge bg-danger">{{ cart.totalItems() }}</span>
                  }
                </a>
              </li>
            }

            @if (auth.isLoggedIn()) {
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle d-flex align-items-center gap-2"
                  href="#" data-bs-toggle="dropdown">
                  <div class="avatar-circle">
                    {{ auth.profile()?.full_name?.charAt(0)?.toUpperCase() }}
                  </div>
                  <span class="d-none d-lg-inline fw-600">
                    {{ auth.profile()?.full_name }}
                  </span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end rounded-3 border-0 shadow">
                  <li>
                    <span class="dropdown-item-text text-muted small">
                      {{ auth.profile()?.role === 'ADMIN' ? '👑 Admin' : '🛍️ Cliente' }}
                    </span>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <button class="dropdown-item text-danger fw-semibold"
                      (click)="auth.logout()">
                      <i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión
                    </button>
                  </li>
                </ul>
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  auth      = inject(AuthService);
  cart      = inject(CartService);
  storeName = environment.storeName;
}
