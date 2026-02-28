// src/app/core/models/product.model.ts
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
  category?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductForm = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
