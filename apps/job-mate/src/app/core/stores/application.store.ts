import { Injectable, inject, signal, effect } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { GuestContentService } from '../services/guest-content.service';
import { fromApplicationRow } from '../models/mappers';
import type { Application, AppStatus } from '../models/jobmate.models';

function buildGuestApplication(
  payload: Pick<Application, 'title' | 'company' | 'date' | 'location' | 'status' | 'salary' | 'url' | 'tags'>,
): Application {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    userId: 'guest',
    title: payload.title,
    company: payload.company,
    date: payload.date,
    location: payload.location ?? null,
    status: payload.status,
    salary: payload.salary ?? null,
    url: payload.url ?? null,
    tags: payload.tags,
    createdAt: now,
    updatedAt: now,
  };
}

@Injectable({ providedIn: 'root' })
export class ApplicationStore {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly guestContent = inject(GuestContentService);

  private readonly _applications = signal<Application[]>([]);
  private readonly _loaded = signal(false);

  readonly applications = this._applications.asReadonly();

  constructor() {
    effect(() => {
      if (this.auth.user()) {
        this.onSignedIn();
      } else {
        this._applications.set(this.guestContent.applications());
        this._loaded.set(false);
      }
    });
  }

  private async onSignedIn(): Promise<void> {
    await this.migrateGuestApplications();
    await this.load();
  }

  private async migrateGuestApplications(): Promise<void> {
    const guests = this.guestContent.applications();
    const userId = this.auth.user()?.id;
    if (guests.length === 0 || !userId) return;

    for (const guest of guests) {
      await this.supabase.client.from('applications').insert({
        user_id: userId,
        title: guest.title,
        company: guest.company,
        date: guest.date,
        location: guest.location,
        status: guest.status,
        salary: guest.salary,
        url: guest.url,
        tags: guest.tags,
      });
    }
    this.guestContent.clearApplications();
  }

  async load(): Promise<void> {
    if (this._loaded()) return;
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const { data, error } = await this.supabase.client.from('applications').select('*').eq('user_id', userId);
    if (!error && data) {
      this._applications.set(data.map(fromApplicationRow));
      this._loaded.set(true);
    }
  }

  async addApplication(
    payload: Pick<Application, 'title' | 'company' | 'date' | 'location' | 'status' | 'salary' | 'url' | 'tags'>,
  ): Promise<Application | null> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      if (!this.guestContent.canAddApplication()) return null;
      const application = buildGuestApplication(payload);
      this.guestContent.addApplication(application);
      return application;
    }

    const { data, error } = await this.supabase.client.from('applications').insert({
      user_id: userId,
      title: payload.title,
      company: payload.company,
      date: payload.date,
      location: payload.location ?? null,
      status: payload.status,
      salary: payload.salary ?? null,
      url: payload.url ?? null,
      tags: payload.tags,
    }).select().single();

    if (error || !data) return null;
    const app = fromApplicationRow(data);
    this._applications.update(list => [app, ...list]);
    return app;
  }

  async updateApplication(
    id: string,
    patch: Partial<Pick<Application, 'title' | 'company' | 'date' | 'location' | 'status' | 'salary' | 'tags'>>,
  ): Promise<void> {
    const prev = this._applications();
    this._applications.update(list => list.map(a => a.id === id ? { ...a, ...patch } : a));
    const { error } = await this.supabase.client.from('applications').update(patch).eq('id', id);
    if (error) this._applications.set(prev);
  }

  async updateStatus(id: string, status: AppStatus): Promise<void> {
    return this.updateApplication(id, { status });
  }

  async deleteApplication(id: string): Promise<void> {
    const prev = this._applications();
    this._applications.update(list => list.filter(a => a.id !== id));
    const { error } = await this.supabase.client.from('applications').delete().eq('id', id);
    if (error) this._applications.set(prev);
  }

  invalidate(): void {
    this._loaded.set(false);
  }
}
