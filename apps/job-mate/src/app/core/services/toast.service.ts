import { Injectable, signal } from '@angular/core';

export type Toast = {
  readonly id: number;
  readonly message: string;
  readonly kind: 'error' | 'success';
};

const AUTO_DISMISS_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<readonly Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 0;

  error(message: string): void {
    this.push(message, 'error');
  }

  success(message: string): void {
    this.push(message, 'success');
  }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private push(message: string, kind: Toast['kind']): void {
    const id = this.nextId++;
    this._toasts.update(list => [...list, { id, message, kind }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }
}
