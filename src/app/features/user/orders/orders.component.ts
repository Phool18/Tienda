// src/app/features/user/orders/orders.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar />

    <div class="container py-4">
      <h2 class="fw-bold mb-4">
        <i class="bi bi-box-seam me-2 text-primary"></i>Mis Pedidos
      </h2>

      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="text-muted mt-2">Cargando pedidos...</p>
        </div>
      }

      @if (!loading() && orders().length === 0) {
        <div class="empty-state">
          <i class="bi bi-bag-x"></i>
          <h4>Aún no tienes pedidos</h4>
          <p class="mb-4">Explora nuestro catálogo y haz tu primer pedido</p>
          <a routerLink="/catalog" class="btn btn-primary px-4">
            <i class="bi bi-shop me-2"></i>Ver catálogo
          </a>
        </div>
      }

      @if (!loading() && orders().length > 0) {
        <div class="d-flex flex-column gap-3">
          @for (order of orders(); track order.id) {
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-transparent d-flex justify-content-between align-items-center">
                <div>
                  <span class="fw-bold text-dark">
                    Pedido #{{ order.id.substring(0,8).toUpperCase() }}
                  </span>
                  <small class="text-muted ms-3">
                    <i class="bi bi-calendar me-1"></i>
                    {{ order.created_at | date:'dd/MM/yyyy HH:mm' }}
                  </small>
                </div>
                <span class="status-badge {{ order.status }}">
                  <i class="bi me-1" [class]="getStatusIcon(order.status)"></i>
                  {{ order.status }}
                </span>
              </div>

              <div class="card-body">
                <!-- Items del pedido -->
                @if (order.order_items && order.order_items.length > 0) {
                  <div class="row g-2 mb-3">
                    @for (item of order.order_items; track item.id) {
                      <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                          <span>
                            <i class="bi bi-dot text-primary"></i>
                            {{ item.products?.name ?? 'Producto' }}
                            <span class="text-muted">x{{ item.quantity }}</span>
                          </span>
                          <span class="fw-semibold">
                            S/ {{ (item.unit_price * item.quantity) | number:'1.2-2' }}
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                }

                @if (order.notes) {
                  <p class="text-muted small mb-2">
                    <i class="bi bi-chat-left-text me-1"></i>
                    <em>{{ order.notes }}</em>
                  </p>
                }

                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted small">
                    {{ order.order_items?.length ?? 0 }} producto(s)
                  </span>
                  <span class="h6 text-primary fw-bold mb-0">
                    Total: S/ {{ order.total | number:'1.2-2' }}
                  </span>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  orders  = signal<Order[]>([]);
  loading = signal(true);

  async ngOnInit() {
    try {
      const data = await this.orderService.getMyOrders();
      this.orders.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pendiente:  'bi-clock',
      confirmado: 'bi-check-circle',
      entregado:  'bi-check2-all',
      cancelado:  'bi-x-circle'
    };
    return icons[status] ?? 'bi-circle';
  }
}
