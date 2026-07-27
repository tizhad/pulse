import { Injectable, signal } from '@angular/core';

export type CelebrationKind = 'celebration' | 'encouragement';

export type Celebration = {
  readonly kind: CelebrationKind;
  readonly icon: string | null;
  readonly title: string;
  readonly message: string;
};

@Injectable({ providedIn: 'root' })
export class CelebrationService {
  private readonly _celebration = signal<Celebration | null>(null);
  readonly celebration = this._celebration.asReadonly();

  celebrate(title: string, message: string): void {
    this._celebration.set({ kind: 'celebration', icon: '🎉', title, message });
  }

  encourage(title: string, message: string): void {
    this._celebration.set({ kind: 'encouragement', icon: null, title, message });
  }

  dismiss(): void {
    this._celebration.set(null);
  }
}
