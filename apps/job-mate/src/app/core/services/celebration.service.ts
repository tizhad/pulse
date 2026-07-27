import { Injectable, signal } from '@angular/core';

export type Celebration = {
  readonly title: string;
  readonly message: string;
};

@Injectable({ providedIn: 'root' })
export class CelebrationService {
  private readonly _celebration = signal<Celebration | null>(null);
  readonly celebration = this._celebration.asReadonly();

  celebrate(title: string, message: string): void {
    this._celebration.set({ title, message });
  }

  dismiss(): void {
    this._celebration.set(null);
  }
}
