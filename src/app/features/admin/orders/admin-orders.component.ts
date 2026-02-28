// src/app/features/admin/orders/admin-orders.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { Order, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar />

    <div class="container-fluid py-4">

            <div class="mb-4">
        <h2 class="fw-bold mb-3">
          <i class="bi bi-receipt me-2 text-primary"></i>Gestión de Pedidos
        </h2>
        <div class="d-flex flex-wrap gap-2">
          <span class="badge bg-warning-subtle text-warning px-3 py-2">
            <i class="bi bi-clock me-1"></i>Pendientes: {{ countByStatus('pendiente') }}
          </span>
          <span class="badge bg-primary-subtle text-primary px-3 py-2">
            <i class="bi bi-check-circle me-1"></i>Confirmados: {{ countByStatus('confirmado') }}
          </span>
          <span class="badge bg-success-subtle text-success px-3 py-2">
            <i class="bi bi-check2-all me-1"></i>Entregados: {{ countByStatus('entregado') }}
          </span>
        </div>
      </div>

      <!-- Filtros -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <select class="form-select" [(ngModel)]="filterStatus">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div class="col-md-4">
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input
              type="text"
              class="form-control"
              placeholder="Buscar por cliente o ID..."
              [(ngModel)]="searchTerm"
            >
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (!loading()) {
  <div class="d-flex flex-column gap-3">
    @for (order of filtered(); track order.id) {
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-body">
          <!-- Header del pedido -->
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <span class="font-monospace fw-bold text-muted">
                #{{ order.id.substring(0,8).toUpperCase() }}
              </span>
              <br>
              <small class="text-muted">
                {{ order.created_at | date:'dd/MM/yy HH:mm' }}
              </small>
            </div>
            <span class="status-badge {{ order.status }}">{{ order.status }}</span>
          </div>

          <!-- Cliente -->
          <div class="mb-2 p-2 rounded-3" style="background:#fce7f3">
            <div class="fw-semibold">{{ order.profiles?.full_name ?? 'N/A' }}</div>
            @if (order.profiles?.phone) {
              <small class="text-muted">
                <i class="bi bi-whatsapp text-success me-1"></i>{{ order.profiles?.phone }}
              </small>
            }
          </div>

          <!-- Productos -->
          @if (order.order_items && order.order_items.length > 0) {
            <div class="mb-2">
              @for (item of order.order_items; track item.id) {
                <div class="d-flex justify-content-between small py-1 border-bottom">
                  <span>{{ item.products?.name }} x{{ item.quantity }}</span>
                  <span class="fw-semibold">S/ {{ (item.unit_price * item.quantity) | number:'1.2-2' }}</span>
                </div>
              }
            </div>
          }

          <!-- Total + cambiar estado -->
          <div class="d-flex justify-content-between align-items-center mt-2">
            <span class="fw-bold text-primary">Total: S/ {{ order.total | number:'1.2-2' }}</span>
            <select
              class="form-select form-select-sm w-auto"
              [value]="order.status"
              (change)="changeStatus(order, $any($event.target).value)"
              [disabled]="updatingId() === order.id"
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>
    } @empty {
      <div class="empty-state">
        <span class="empty-emoji">📋</span>
        <h4>No hay pedidos</h4>
      </div>
    }
  </div>
  <div class="text-muted small mt-2">
    Mostrando {{ filtered().length }} de {{ orders().length }} pedidos
  </div>
}
    </div>
  `
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  orders      = signal<Order[]>([]);
  loading     = signal(true);
  updatingId  = signal<string | null>(null);
  filterStatus = '';
  searchTerm   = '';

  filtered = computed(() => {
    let list = this.orders();

    if (this.filterStatus) {
      list = list.filter(o => o.status === this.filterStatus);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(term) ||
        o.profiles?.full_name?.toLowerCase().includes(term)
      );
    }

    return list;
  });

  async ngOnInit() {
    try {
      const data = await this.orderService.getAllOrders();
      this.orders.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  countByStatus(status: string): number {
    return this.orders().filter(o => o.status === status).length;
  }

  async changeStatus(order: Order, newStatus: OrderStatus) {
    if (order.status === newStatus) return;

    this.updatingId.set(order.id);
    try {
      await this.orderService.updateOrderStatus(order.id, newStatus);
      this.orders.update(list =>
        list.map(o => o.id === order.id ? { ...o, status: newStatus } : o)
      );
      this.toastService.success(`Pedido actualizado a "${newStatus}"`);
    } catch {
      this.toastService.error('Error al actualizar el estado del pedido');
    } finally {
      this.updatingId.set(null);
    }
  }
}
