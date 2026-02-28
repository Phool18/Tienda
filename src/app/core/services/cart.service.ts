// src/app/core/services/cart.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../models/order.model';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>([]);

  readonly items      = this._items.asReadonly();
  readonly totalItems = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );
  readonly totalPrice = computed(() =>
    this._items().reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  addToCart(product: Product, quantity = 1) {
    const current = this._items();
    const idx = current.findIndex(i => i.product.id === product.id);

    if (idx >= 0) {
      const updated = [...current];
      updated[idx] = {
        ...updated[idx],
        quantity: updated[idx].quantity + quantity
      };
      this._items.set(updated);
    } else {
      this._items.set([...current, { product, quantity }]);
    }
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this._items.update(items =>
      items.map(i => i.product.id === productId ? { ...i, quantity } : i)
    );
  }

  removeFromCart(productId: string) {
    this._items.update(items => items.filter(i => i.product.id !== productId));
  }

  clearCart() {
    this._items.set([]);
  }
}
