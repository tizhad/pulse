import { Injectable, signal } from '@angular/core';

export type AuthModalMode = 'signin' | 'signup';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  readonly isOpen = signal(false);
  readonly mode = signal<AuthModalMode>('signin');
  readonly reason = signal<string | null>(null);

  open(mode: AuthModalMode = 'signin', reason: string | null = null): void {
    this.mode.set(mode);
    this.reason.set(reason);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
