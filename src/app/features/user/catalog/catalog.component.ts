// src/app/features/user/catalog/catalog.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar />

    <div class="catalog-hero text-center py-4">
      <h1 class="display-5 fw-bold mb-2">🎂 Nuestros Postres</h1>
      <p class="text-muted fs-5">Hechos con amor, listos para endulzar tu día 🍭</p>
    </div>

    <div class="container pb-5">

      <!-- Filtros -->
      <div class="filter-bar rounded-3 p-3 mb-4">
        <div class="row g-2">
          <div class="col-12">
            <div class="input-group">
              <span class="input-group-text">🔍</span>
              <input
                type="text"
                class="form-control"
                placeholder="Buscar postre..."
                [value]="searchTerm()"
                (input)="searchTerm.set($any($event.target).value)"
              >
            </div>
          </div>
          <div class="col-6">
            <select
              class="form-select"
              [value]="selectedCategory()"
              (change)="selectedCategory.set($any($event.target).value)"
            >
              <option value="">Todas las categorías</option>
              @for (cat of categories(); track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>
          <div class="col-6">
            <select
              class="form-select"
              [value]="sortBy()"
              (change)="sortBy.set($any($event.target).value)"
            >
              <option value="name">A - Z</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
            </select>
          </div>
          <div class="col-12">
            <a routerLink="/cart" class="btn btn-pastel-primary w-100 position-relative">
              <i class="bi bi-bag-heart me-2"></i>Ver carrito
              @if (cart.totalItems() > 0) {
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {{ cart.totalItems() }}
                </span>
              }
            </a>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-pastel mb-3"></div>
          <p class="text-muted">Preparando los postres... 🍰</p>
        </div>
      }

      <!-- Sin resultados -->
      @if (!loading() && filtered().length === 0) {
        <div class="empty-state">
          <span class="empty-emoji">🍪</span>
          <h4>No encontramos postres</h4>
          <p>Intenta con otros términos de búsqueda</p>
        </div>
      }

      <!-- Grid -->
      @if (!loading() && filtered().length > 0) {
        <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
          @for (product of filtered(); track product.id) {
            <div class="col">
              <div class="card product-card h-100 border-0 shadow-sm">
                @if (product.image_url) {
                  <img [src]="product.image_url" [alt]="product.name" class="product-img">
                } @else {
                  <div class="product-img-placeholder">
                    {{ getCategoryEmoji(product.category) }}
                  </div>
                }
                <div class="card-body d-flex flex-column">
                  @if (product.category) {
                    <span class="category-badge mb-2 align-self-start">{{ product.category }}</span>
                  }
                  <h6 class="card-title fw-bold mb-1">{{ product.name }}</h6>
                  @if (product.description) {
                    <p class="card-text text-muted small flex-grow-1">
                      {{ product.description | slice:0:75 }}{{ product.description.length > 75 ? '...' : '' }}
                    </p>
                  }
                  <div class="d-flex justify-content-between align-items-center mt-auto pt-2">
                    <span class="price-tag">S/ {{ product.price | number:'1.2-2' }}</span>
                    <small class="text-muted">
                      {{ product.stock > 0 ? product.stock + ' disponibles' : 'Sin stock' }}
                    </small>
                  </div>
                </div>
                <div class="card-footer bg-transparent border-0 pt-0 pb-3 px-3">
                  <button
                    class="btn btn-pastel-primary w-100"
                    [disabled]="product.stock === 0"
                    (click)="addToCart(product)"
                  >
                    @if (product.stock === 0) { Sin stock }
                    @else { <i class="bi bi-bag-plus me-2"></i>Agregar 🛍️ }
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .catalog-hero {
      background: linear-gradient(135deg, #fce7f3 0%, #f5f3ff 50%, #fff7ed 100%);
      border-bottom: 2px solid #fce7f3;
    }
    .filter-bar { background: #fff; border: 2px solid #fce7f3; }
    .spinner-pastel {
      width: 48px; height: 48px;
      border: 4px solid #fce7f3;
      border-top-color: #ec4899;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CatalogComponent implements OnInit {
  private productService = inject(ProductService);
  private toastService   = inject(ToastService);
  cart = inject(CartService);

  products         = signal<Product[]>([]);
  categories       = signal<string[]>([]);
  loading          = signal(true);
  searchTerm       = signal('');
  selectedCategory = signal('');
  sortBy           = signal('name');

  filtered = computed(() => {
    let list = this.products();
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }
    const cat = this.selectedCategory();
    if (cat) {
      list = list.filter(p => p.category === cat);
    }
    const sort = this.sortBy();
    return [...list].sort((a, b) => {
      if (sort === 'price_asc')  return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
  });

  async ngOnInit() {
    try {
      const [products, categories] = await Promise.all([
        this.productService.getActiveProducts(),
        this.productService.getCategories()
      ]);
      this.products.set(products);
      this.categories.set(categories);
    } catch {
      this.toastService.error('Error al cargar los productos');
    } finally {
      this.loading.set(false);
    }
  }

  addToCart(product: Product) {
    this.cart.addToCart(product);
    this.toastService.success(`"${product.name}" agregado 🛍️`);
  }

  getCategoryEmoji(category?: string): string {
    const map: Record<string, string> = {
      'Tortas': '🎂', 'Pasteles': '🍰', 'Cupcakes': '🧁',
      'Galletas': '🍪', 'Chocolates': '🍫', 'Donas': '🍩',
      'Helados': '🍦', 'Macarons': '🌸', 'Brownies': '🟫'
    };
    return map[category ?? ''] ?? '🍬';
  }
}
