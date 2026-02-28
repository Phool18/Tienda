// src/app/core/services/order.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { CartItem, Order, OrderStatus } from '../models/order.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private db   = inject(SupabaseService);
  private auth = inject(AuthService);

  // ── Crear pedido desde carrito ─────────────────────────
  async createOrder(cart: CartItem[], notes?: string): Promise<Order> {
    const userId = this.auth.profile()?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    const total = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity, 0
    );

    // 1. Insertar la orden
    const { data: order, error: orderError } = await this.db
      .from('orders')
      .insert({ user_id: userId, total, notes: notes ?? null, status: 'pendiente' })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Insertar los ítems
    const items = cart.map(item => ({
      order_id:   order['id'],
      product_id: item.product.id,
      quantity:   item.quantity,
      unit_price: item.product.price
    }));

    const { error: itemsError } = await this.db
      .from('order_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return order as Order;
  }

  // ── Pedidos del usuario logueado ───────────────────────
  async getMyOrders(): Promise<Order[]> {
    const { data, error } = await this.db
      .from('orders')
      .select('*, order_items(*, products(name, image_url, price))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Order[];
  }

  // ── Admin: todos los pedidos ───────────────────────────
  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await this.db
      .from('orders')
      .select('*, profiles(full_name, phone), order_items(*, products(name, price))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Order[];
  }

  // ── Admin: cambiar estado ──────────────────────────────
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await this.db
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw error;
  }

  // ── Generar link de WhatsApp ───────────────────────────
  generateWhatsAppLink(order: Order, cart: CartItem[]): string {
    const orderId = order.id.substring(0, 8).toUpperCase();

    const itemsText = cart.map(item => {
      const subtotal = (item.product.price * item.quantity).toFixed(2);
      return `  • ${item.product.name} x${item.quantity} — S/ ${subtotal}`;
    }).join('\n');

   const message =
     `*Pedido #${orderId}* 🍰\n` +
     `Fecha: ${new Date().toLocaleDateString('es-PE', { dateStyle: 'long' })}\n\n` +
     `*Productos:*\n${itemsText}\n\n` +
     `*TOTAL: S/ ${order.total.toFixed(2)}*\n\n` +
     (order.notes ? `Nota: ${order.notes}\n\n` : '') +
     `Gracias por tu pedido!`;

    return `https://wa.me/${environment.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }
}
