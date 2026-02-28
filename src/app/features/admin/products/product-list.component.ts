// src/app/features/admin/products/product-list.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, Validators, ReactiveFormsModule, FormGroup
} from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  template: `
    <app-navbar />

    <div class="mb-4">
  <div class="d-flex justify-content-between align-items-center">
    <h2 class="fw-bold mb-0">
      <i class="bi bi-box me-2 text-primary"></i>Gestión de Productos
    </h2>
    <button class="btn btn-primary" (click)="openModal()">
      <i class="bi bi-plus-circle me-1"></i>
      <span class="d-none d-sm-inline">Nuevo </span>Producto
    </button>
  </div>
</div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
      }

      <!-- Tabla -->
      @if (!loading()) {
        <div class="card border-0 shadow-sm">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table admin-table mb-0">
                <thead>
                  <tr>
                    <th class="ps-4">Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (product of products(); track product.id) {
                    <tr>
                      <td class="ps-4">
                        <div class="d-flex align-items-center gap-3">
                          @if (product.image_url) {
                            <img
                              [src]="product.image_url"
                              [alt]="product.name"
                              class="rounded"
                              style="width:48px;height:48px;object-fit:cover"
                            >
                          } @else {
                            <div
                              class="rounded bg-light d-flex align-items-center justify-content-center"
                              style="width:48px;height:48px"
                            >
                              <i class="bi bi-box-seam text-muted"></i>
                            </div>
                          }
                          <div>
                            <div class="fw-semibold">{{ product.name }}</div>
                            @if (product.description) {
                              <small class="text-muted">
                                {{ product.description | slice:0:50 }}...
                              </small>
                            }
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge bg-light text-secondary">
                          {{ product.category ?? '—' }}
                        </span>
                      </td>
                      <td class="fw-bold text-primary">S/ {{ product.price | number:'1.2-2' }}</td>
                      <td>
                        <span [class]="product.stock <= 5 ? 'text-danger fw-bold' : ''">
                          {{ product.stock }}
                        </span>
                      </td>
                      <td>
                        <span
                          class="badge"
                          [class]="product.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'"
                        >
                          {{ product.active ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="text-center">
                        <button
                          class="btn btn-sm btn-outline-primary me-1"
                          (click)="openModal(product)"
                          title="Editar"
                        >
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button
                          class="btn btn-sm btn-outline-danger"
                          (click)="confirmDelete(product)"
                          title="Eliminar"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Modal Crear/Editar -->
    @if (showModal()) {
      <div class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title fw-bold">
                <i class="bi me-2" [class]="editingProduct() ? 'bi-pencil' : 'bi-plus-circle'"></i>
                {{ editingProduct() ? 'Editar Producto' : 'Nuevo Producto' }}
              </h5>
              <button class="btn-close" (click)="closeModal()"></button>
            </div>

            <form [formGroup]="productForm" (ngSubmit)="saveProduct()">
              <div class="modal-body">
                <div class="row g-3">
                  <div class="col-md-8">
                    <label class="form-label fw-semibold">Nombre *</label>
                    <input
                      type="text"
                      class="form-control"
                      formControlName="name"
                      placeholder="Nombre del producto"
                      [class.is-invalid]="isInvalid('name')"
                    >
                    @if (isInvalid('name')) {
                      <div class="invalid-feedback">El nombre es requerido</div>
                    }
                  </div>

                  <div class="col-md-4">
                    <label class="form-label fw-semibold">Categoría</label>
                    <input
                      type="text"
                      class="form-control"
                      formControlName="category"
                      placeholder="Ej: Electrónica"
                    >
                  </div>

                  <div class="col-12">
                    <label class="form-label fw-semibold">Descripción</label>
                    <textarea
                      class="form-control"
                      formControlName="description"
                      rows="2"
                      placeholder="Descripción breve del producto"
                    ></textarea>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label fw-semibold">Precio (S/) *</label>
                    <div class="input-group">
                      <span class="input-group-text">S/</span>
                      <input
                        type="number"
                        class="form-control"
                        formControlName="price"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        [class.is-invalid]="isInvalid('price')"
                      >
                    </div>
                    @if (isInvalid('price')) {
                      <div class="invalid-feedback d-block">Ingresa un precio válido</div>
                    }
                  </div>

                  <div class="col-md-4">
                    <label class="form-label fw-semibold">Stock *</label>
                    <input
                      type="number"
                      class="form-control"
                      formControlName="stock"
                      min="0"
                      placeholder="0"
                      [class.is-invalid]="isInvalid('stock')"
                    >
                    @if (isInvalid('stock')) {
                      <div class="invalid-feedback">El stock es requerido</div>
                    }
                  </div>

                  <div class="col-md-4">
                    <label class="form-label fw-semibold">Estado</label>
                    <select class="form-select" formControlName="active">
                      <option [value]="true">Activo</option>
                      <option [value]="false">Inactivo</option>
                    </select>
                  </div>

                  <!-- Imagen -->
                  <div class="col-12">
                    <label class="form-label fw-semibold">Imagen del producto</label>
                    <input
                      type="file"
                      class="form-control"
                      accept="image/*"
                      (change)="onFileSelected($event)"
                    >
                    @if (uploadingImage()) {
                      <div class="mt-2 text-muted small">
                        <span class="spinner-border spinner-border-sm me-1"></span>
                        Subiendo imagen...
                      </div>
                    }
                    @if (productForm.get('image_url')?.value) {
                      <img
                        [src]="productForm.get('image_url')?.value"
                        class="mt-2 rounded"
                        style="height:80px;object-fit:cover"
                        alt="preview"
                      >
                    }
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn btn-primary fw-semibold"
                  [disabled]="saving() || uploadingImage()"
                >
                  @if (saving()) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  {{ editingProduct() ? 'Guardar cambios' : 'Crear producto' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Confirmar eliminación -->
    @if (deletingProduct()) {
      <div class="modal d-block" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold text-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>Confirmar eliminación
              </h5>
            </div>
            <div class="modal-body">
              ¿Estás seguro de eliminar
              <strong>{{ deletingProduct()?.name }}</strong>?
              El producto quedará inactivo y no aparecerá en el catálogo.
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-secondary" (click)="deletingProduct.set(null)">
                Cancelar
              </button>
              <button
                class="btn btn-danger fw-semibold"
                [disabled]="saving()"
                (click)="deleteProduct()"
              >
                @if (saving()) {
                  <span class="spinner-border spinner-border-sm me-1"></span>
                }
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private toastService   = inject(ToastService);
  private fb             = inject(FormBuilder);

  products        = signal<Product[]>([]);
  loading         = signal(true);
  showModal       = signal(false);
  saving          = signal(false);
  uploadingImage  = signal(false);
  editingProduct  = signal<Product | null>(null);
  deletingProduct = signal<Product | null>(null);

  productForm!: FormGroup;

  async ngOnInit() {
    await this.loadProducts();
  }

  async loadProducts() {
    try {
      const data = await this.productService.getAllProducts();
      this.products.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  openModal(product?: Product) {
    this.editingProduct.set(product ?? null);
    this.productForm = this.fb.group({
      name:        [product?.name ?? '',        Validators.required],
      description: [product?.description ?? ''],
      price:       [product?.price ?? '',        [Validators.required, Validators.min(0)]],
      stock:       [product?.stock ?? 0,         [Validators.required, Validators.min(0)]],
      category:    [product?.category ?? ''],
      image_url:   [product?.image_url ?? ''],
      active:      [product?.active ?? true]
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingProduct.set(null);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.productForm?.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    try {
      const url = await this.productService.uploadImage(file);
      this.productForm.patchValue({ image_url: url });
      this.toastService.success('Imagen subida correctamente');
    } catch {
      this.toastService.error('Error al subir la imagen');
    } finally {
      this.uploadingImage.set(false);
    }
  }

  async saveProduct() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      const values = this.productForm.value;
      const editing = this.editingProduct();

      if (editing) {
        const updated = await this.productService.updateProduct(editing.id, values);
        this.products.update(list =>
          list.map(p => p.id === updated.id ? updated : p)
        );
        this.toastService.success('Producto actualizado');
      } else {
        const created = await this.productService.createProduct(values);
        this.products.update(list => [created, ...list]);
        this.toastService.success('Producto creado');
      }

      this.closeModal();
    } catch {
      this.toastService.error('Error al guardar el producto');
    } finally {
      this.saving.set(false);
    }
  }

  confirmDelete(product: Product) {
    this.deletingProduct.set(product);
  }

  async deleteProduct() {
    const product = this.deletingProduct();
    if (!product) return;

    this.saving.set(true);
    try {
      await this.productService.deleteProduct(product.id);
      this.products.update(list =>
        list.map(p => p.id === product.id ? { ...p, active: false } : p)
      );
      this.toastService.success('Producto eliminado');
      this.deletingProduct.set(null);
    } catch {
      this.toastService.error('Error al eliminar el producto');
    } finally {
      this.saving.set(false);
    }
  }
}
