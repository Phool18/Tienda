// src/app/shared/components/toast/toast.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container-custom">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast show align-items-center border-0 mb-2"
          [class]="'text-bg-' + toast.type"
          role="alert"
        >
          <div class="d-flex">
            <div class="toast-body fw-semibold">
              <i class="bi me-2" [class]="getIcon(toast.type)"></i>
              {{ toast.message }}
            </div>
            <button
              type="button"
              class="btn-close btn-close-white me-2 m-auto"
              (click)="toastService.remove(toast.id)"
            ></button>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: 'bi-check-circle-fill',
      error:   'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info:    'bi-info-circle-fill'
    };
    return icons[type] ?? 'bi-info-circle-fill';
  }
}
