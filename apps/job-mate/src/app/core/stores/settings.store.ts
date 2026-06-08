import { Injectable, inject, signal, effect } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { fromSettingsRow } from '../models/mappers';
import type { UserSettings, ResumeData } from '../models/jobmate.models';
import type { Json } from '../models/database.types';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private readonly _settings = signal<UserSettings | null>(null);
  private readonly _loaded = signal(false);

  readonly settings = this._settings.asReadonly();

  constructor() {
    effect(() => {
      if (this.auth.user()) {
        this.load();
      } else {
        this._settings.set(null);
        this._loaded.set(false);
      }
    });
  }

  async load(): Promise<void> {
    if (this._loaded()) return;
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const { data, error } = await this.supabase.client.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
    if (!error) {
      this._settings.set(data ? fromSettingsRow(data) : null);
      this._loaded.set(true);
    }
  }

  async upsert(patch: Partial<Pick<UserSettings, 'displayName' | 'accent' | 'resume'>>): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const prev = this._settings();
    this._settings.update(s => s ? { ...s, ...patch } : null);

    const resumeValue: Json | undefined = patch.resume !== undefined
      ? (patch.resume as unknown as Json)
      : undefined;

    const { data, error } = await this.supabase.client.from('user_settings').upsert({
      user_id: userId,
      display_name: patch.displayName ?? prev?.displayName ?? null,
      accent: patch.accent ?? prev?.accent ?? 'indigo',
      ...(resumeValue !== undefined ? { resume: resumeValue } : {}),
    }).select().single();

    if (error) {
      this._settings.set(prev);
    } else if (data) {
      this._settings.set(fromSettingsRow(data));
    }
  }

  invalidate(): void {
    this._loaded.set(false);
  }
}
