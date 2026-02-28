// src/app/features/user/cart/cart.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar />

    <div class="container py-4">
      <h2 class="fw-bold mb-4">
        <i class="bi bi-cart3 me-2 text-primary"></i>Mi Carrito
      </h2>

      <!-- Carrito vacío -->
      @if (cart.isEmpty()) {
        <div class="empty-state">
          <i class="bi bi-cart-x"></i>
          <h4>Tu carrito está vacío</h4>
          <p class="mb-4">Agrega algunos productos para continuar</p>
          <a routerLink="/catalog" class="btn btn-primary px-4">
            <i class="bi bi-shop me-2"></i>Ir al catálogo
          </a>
        </div>
      }

      @if (!cart.isEmpty()) {
        <div class="row g-4">

          <!-- Lista de items -->
          <div class="col-lg-8">
            <div class="card border-0 shadow-sm">
              <div class="card-body p-0">
                @for (item of cart.items(); track item.product.id) {
                  <div class="p-3 border-bottom">
                    <div class="d-flex align-items-center gap-2 mb-2">

                      <!-- Imagen -->
                      @if (item.product.image_url) {
                        <img
                          [src]="item.product.image_url"
                          [alt]="item.product.name"
                          class="rounded"
                          style="width:56px;height:56px;object-fit:cover;flex-shrink:0"
                        >
                      } @else {
                        <div
                          class="rounded bg-light d-flex align-items-center justify-content-center"
                          style="width:56px;height:56px;flex-shrink:0"
                        >
                          <i class="bi bi-box-seam text-secondary"></i>
                        </div>
                      }

                      <!-- Nombre y precio -->
                      <div class="flex-grow-1 min-width-0">
                        <div class="fw-bold text-truncate">{{ item.product.name }}</div>
                        <small class="text-muted">
                          S/ {{ item.product.price | number:'1.2-2' }} c/u
                        </small>
                      </div>

                      <!-- Eliminar -->
                      <button
                        class="btn btn-outline-danger btn-sm"
                        (click)="cart.removeFromCart(item.product.id)"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>

                    <!-- Cantidad y subtotal -->
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="d-flex align-items-center gap-2">
                        <button
                          class="btn btn-outline-secondary btn-sm"
                          (click)="cart.updateQuantity(item.product.id, item.quantity - 1)"
                        >
                          <i class="bi bi-dash"></i>
                        </button>
                        <span class="fw-bold px-2">{{ item.quantity }}</span>
                        <button
                          class="btn btn-outline-secondary btn-sm"
                          [disabled]="item.quantity >= item.product.stock"
                          (click)="cart.updateQuantity(item.product.id, item.quantity + 1)"
                        >
                          <i class="bi bi-plus"></i>
                        </button>
                      </div>
                      <span class="fw-bold text-primary fs-6">
                        S/ {{ (item.product.price * item.quantity) | number:'1.2-2' }}
                      </span>
                    </div>
                  </div>
                }
              </div>

              <div class="card-footer bg-transparent text-end">
                <button class="btn btn-outline-danger btn-sm" (click)="cart.clearCart()">
                  <i class="bi bi-trash me-1"></i>Vaciar carrito
                </button>
              </div>
            </div>
          </div>

          <!-- Resumen del pedido -->
          <div class="col-lg-4">
            <div class="card border-0 shadow-sm sticky-top" style="top:1rem">
              <div class="card-body">
                <h5 class="fw-bold mb-3">Resumen del pedido</h5>

                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Productos ({{ cart.totalItems() }})</span>
                  <span>S/ {{ cart.totalPrice() | number:'1.2-2' }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Envío</span>
                  <span class="text-success">A coordinar</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between mb-4">
                  <span class="fw-bold fs-5">Total</span>
                  <span class="fw-bold fs-5 text-primary">
                    S/ {{ cart.totalPrice() | number:'1.2-2' }}
                  </span>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold">
                    Nota para el pedido (opcional)
                  </label>
                  <textarea
                    class="form-control form-control-sm"
                    rows="2"
                    [(ngModel)]="notes"
                    placeholder="Instrucciones especiales..."
                  ></textarea>
                </div>

                <button
                  class="btn btn-success w-100 py-2 fw-semibold"
                  [disabled]="processing()"
                  (click)="placeOrder()"
                >
                  @if (processing()) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Procesando...
                  } @else {
                    <i class="bi bi-bag-check me-2"></i>Confirmar pedido
                  }
                </button>

                <a routerLink="/catalog" class="btn btn-outline-secondary w-100 mt-2">
                  <i class="bi bi-arrow-left me-2"></i>Seguir comprando
                </a>
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Modal WhatsApp -->
    @if (whatsappUrl()) {
      <div class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold">
                <i class="bi bi-bag-check-fill text-success me-2"></i>
                ¡Pedido generado con éxito!
              </h5>
            </div>
            <div class="modal-body text-center py-4">
              <div class="mb-3">
                <i class="bi bi-whatsapp text-success" style="font-size:4rem"></i>
              </div>
              <h6 class="mb-2">Ahora envía tu pedido por WhatsApp</h6>
              <p class="text-muted small mb-4">
                Al hacer clic, se abrirá WhatsApp con el detalle de tu pedido listo para enviar.
              </p>
              <a
                [href]="whatsappUrl()"
                target="_blank"
                class="btn btn-success btn-lg px-5 fw-semibold"
                (click)="onWhatsAppSent()"
              >
                <i class="bi bi-whatsapp me-2"></i>Enviar por WhatsApp
              </a>
            </div>
            <div class="modal-footer border-0 justify-content-center">
              <button class="btn btn-outline-secondary" (click)="closeModal()">
                Cerrar y ver mis pedidos
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class CartComponent {
  cart         = inject(CartService);
  orderService = inject(OrderService);
  toastService = inject(ToastService);
  router       = inject(Router);

  processing  = signal(false);
  notes       = '';
  whatsappUrl = signal('');

  async placeOrder() {
    this.processing.set(true);
    try {
      const order = await this.orderService.createOrder(this.cart.items(), this.notes);
      const url   = this.orderService.generateWhatsAppLink(order, this.cart.items());
      this.whatsappUrl.set(url);
      this.cart.clearCart();
    } catch {
      this.toastService.error('Error al generar el pedido. Intenta de nuevo.');
    } finally {
      this.processing.set(false);
    }
  }

  onWhatsAppSent() {
    this.toastService.success('¡Pedido enviado correctamente!');
  }

  closeModal() {
    this.whatsappUrl.set('');
    this.router.navigate(['/my-orders']);
  }
}
