// src/app/core/models/order.model.ts
import { Product } from './product.model';
import { Profile } from './user.model';

export type OrderStatus = 'pendiente' | 'confirmado' | 'entregado' | 'cancelado';

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  profiles?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  products?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
