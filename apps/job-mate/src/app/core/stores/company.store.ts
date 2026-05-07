import { Injectable, inject, signal, effect } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { fromCompanyRow } from '../models/mappers';
import type { Company, CompanyStatus } from '../models/jobmate.models';

@Injectable({ providedIn: 'root' })
export class CompanyStore {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private readonly _companies = signal<Company[]>([]);
  private readonly _loaded = signal(false);

  readonly companies = this._companies.asReadonly();

  constructor() {
    effect(() => {
      if (this.auth.user()) {
        this.load();
      } else {
        this._companies.set([]);
        this._loaded.set(false);
      }
    });
  }

  async load(): Promise<void> {
    if (this._loaded()) return;
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const { data, error } = await this.supabase.client.from('companies').select('*').eq('user_id', userId);
    if (!error && data) {
      this._companies.set(data.map(fromCompanyRow));
      this._loaded.set(true);
    }
  }

  async addCompany(name: string, category: string, status: CompanyStatus = 'saved'): Promise<Company | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

    const { data, error } = await this.supabase.client.from('companies')
      .insert({ user_id: userId, name, category, status })
      .select().single();

    if (error || !data) return null;
    const company = fromCompanyRow(data);
    this._companies.update(list => [company, ...list]);
    return company;
  }

  async updateStatus(id: string, status: CompanyStatus): Promise<void> {
    const prev = this._companies();
    this._companies.update(list => list.map(c => c.id === id ? { ...c, status } : c));
    const { error } = await this.supabase.client.from('companies').update({ status }).eq('id', id);
    if (error) this._companies.set(prev);
  }

  async updateCompany(id: string, patch: Partial<Pick<Company, 'name' | 'category' | 'status'>>): Promise<void> {
    const prev = this._companies();
    this._companies.update(list => list.map(c => c.id === id ? { ...c, ...patch } : c));
    const { error } = await this.supabase.client.from('companies').update(patch).eq('id', id);
    if (error) this._companies.set(prev);
  }

  async deleteCompany(id: string): Promise<void> {
    const prev = this._companies();
    this._companies.update(list => list.filter(c => c.id !== id));
    const { error } = await this.supabase.client.from('companies').delete().eq('id', id);
    if (error) this._companies.set(prev);
  }

  invalidate(): void {
    this._loaded.set(false);
  }
}
