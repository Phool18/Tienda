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
      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
      }

      <!-- Tabla de pedidos -->
      @if (!loading()) {
        <div class="card border-0 shadow-sm">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table admin-table mb-0">
                <thead>
                  <tr>
                    <th class="ps-4">ID Pedido</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th class="text-center">Cambiar estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of filtered(); track order.id) {
                    <tr>
                      <td class="ps-4">
                        <span class="font-monospace fw-bold text-muted">
                          #{{ order.id.substring(0,8).toUpperCase() }}
                        </span>
                      </td>
                      <td>
                        <div class="fw-semibold">{{ order.profiles?.full_name ?? 'N/A' }}</div>
                        @if (order.profiles?.phone) {
                          <small class="text-muted">
                            <i class="bi bi-whatsapp text-success me-1"></i>
                            {{ order.profiles?.phone }}
                          </small>
                        }
                      </td>
                      <td>
                        @if (order.order_items && order.order_items.length > 0) {
                          <div>
                            @for (item of order.order_items; track item.id; let last = $last) {
                              <span class="small">
                                {{ item.products?.name }} x{{ item.quantity }}{{ last ? '' : ', ' }}
                              </span>
                            }
                          </div>
                        }
                      </td>
                      <td class="fw-bold text-primary">
                        S/ {{ order.total | number:'1.2-2' }}
                      </td>
                      <td>
                        <small class="text-muted">
                          {{ order.created_at | date:'dd/MM/yy HH:mm' }}
                        </small>
                      </td>
                      <td>
                        <span class="status-badge {{ order.status }}">
                          {{ order.status }}
                        </span>
                      </td>
                      <td class="text-center">
                        <select
                          class="form-select form-select-sm"
                          style="max-width:150px;margin:auto"
                          [value]="order.status"
                          (change)="changeStatus(order, $any($event.target).value)"
                          [disabled]="updatingId() === order.id"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                        @if (updatingId() === order.id) {
                          <span class="spinner-border spinner-border-sm text-primary mt-1"></span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        No hay pedidos con ese criterio
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer text-muted small bg-transparent">
            Mostrando {{ filtered().length }} de {{ orders().length }} pedidos
          </div>
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
