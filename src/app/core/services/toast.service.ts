// src/app/core/services/toast.service.ts
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: Toast['type'] = 'info') {
    const id = Math.random().toString(36).slice(2);
    this._toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.remove(id), 3500);
  }

  success(message: string) { this.show(message, 'success'); }
  error(message: string)   { this.show(message, 'error'); }
  info(message: string)    { this.show(message, 'info'); }
  warning(message: string) { this.show(message, 'warning'); }

  remove(id: string) {
    this._toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
