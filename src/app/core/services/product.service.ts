// src/app/core/services/product.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Product, ProductForm } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private db = inject(SupabaseService);

  // ── Catálogo público (solo productos activos) ──────────
  async getActiveProducts(category?: string): Promise<Product[]> {
    let query = this.db
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Product[];
  }

  // ── Admin: todos los productos ─────────────────────────
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await this.db
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Product[];
  }

  // ── Obtener categorías únicas ──────────────────────────
  async getCategories(): Promise<string[]> {
    const { data, error } = await this.db
      .from('products')
      .select('category')
      .eq('active', true)
      .not('category', 'is', null);

    if (error) throw error;
    const cats = [...new Set((data ?? []).map((d: any) => d.category as string))];
    return cats.filter(Boolean);
  }

  // ── Crear producto ─────────────────────────────────────
  async createProduct(product: ProductForm): Promise<Product> {
    const { data, error } = await this.db
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  // ── Actualizar producto ────────────────────────────────
  async updateProduct(id: string, updates: Partial<ProductForm>): Promise<Product> {
    const { data, error } = await this.db
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  // ── Eliminar (soft delete) ─────────────────────────────
  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.db
      .from('products')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // ── Subir imagen a Supabase Storage ───────────────────
  async uploadImage(file: File): Promise<string> {
    const ext  = file.name.split('.').pop();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await this.db
      .storage('products')
      .upload(path, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = this.db.storage('products').getPublicUrl(path);
    return data.publicUrl;
  }
}
