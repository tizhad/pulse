import { Injectable, inject, signal, computed } from '@angular/core';
import type { User, AuthError } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  private readonly _user = signal<User | null>(null);
  private readonly _loading = signal(true);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly loading = this._loading.asReadonly();

  constructor() {
    if (!this.supabase.isConfigured) {
      this._loading.set(false);
      return;
    }

    this.supabase.auth.getSession().then(({ data }) => {
      this._user.set(data.session?.user ?? null);
      this._loading.set(false);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._user.set(session?.user ?? null);
    });
  }

  async signIn(email: string, password: string): Promise<AuthError | null> {
    if (!this.supabase.isConfigured) return null;
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (data?.user) this._user.set(data.user);
    return error;
  }

  async signUp(email: string, password: string): Promise<AuthError | null> {
    if (!this.supabase.isConfigured) return null;
    const { error } = await this.supabase.auth.signUp({ email, password });
    return error;
  }

  async signOut(): Promise<void> {
    if (!this.supabase.isConfigured) return;
    await this.supabase.auth.signOut();
  }
}
