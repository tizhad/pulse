import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  Subject,
  Company,
  Application,
  UserSettings,
  SubjectStatus,
  CompanyStatus,
  Content,
  QA,
} from '../models/jobmate.models';
import { StorageService } from './storage.service';
import { SUBJECTS } from '../../data/subjects.data';
import { COMPANIES } from '../../data/companies.data';
import { APPLICATIONS } from '../../data/applications.data';

@Injectable({ providedIn: 'root' })
export class StateService {
  private readonly storage = inject(StorageService);

  readonly subjects = signal<Subject[]>(
    this.storage.load<Subject[]>('subjects') ?? SUBJECTS,
  );

  readonly companies = signal<Company[]>(
    this.storage.load<Company[]>('companies') ?? COMPANIES,
  );

  readonly applications = signal<Application[]>(
    this.storage.load<Application[]>('applications') ?? APPLICATIONS,
  );

  readonly settings = signal<UserSettings>(
    this.storage.load<UserSettings>('settings') ?? {
      displayName: 'Tina Rez',
      email: 'tina@example.com',
      accent: 'indigo',
    },
  );

  readonly streak = signal<number>(this.storage.load<number>('streak') ?? 7);

  /* ── Computed stats ──────────────────────────────────────────────────────── */

  readonly doneCount = computed(
    () => this.subjects().filter((s) => s.status === 'done').length,
  );

  readonly inProgressCount = computed(
    () => this.subjects().filter((s) => s.status === 'in-progress').length,
  );

  readonly toDoCount = computed(
    () => this.subjects().filter((s) => s.status === 'to-do').length,
  );

  readonly totalSubjects = computed(() => this.subjects().length);

  // readonly totalQA = computed(() =>
  //   this.subjects().reduce((sum, s) => sum + s.qaCount, 0),
  // );

  readonly progressPercent = computed(() =>
    Math.round((this.doneCount() / this.totalSubjects()) * 100),
  );

  readonly todaysFocus = computed(() =>
    [...this.subjects()].filter((s) => s.status !== 'done').slice(0, 5),
  );

  readonly recentApplications = computed(() =>
    [...this.applications()].slice(0, 5),
  );

  readonly pipelineCounts = computed(() => {
    const apps = this.applications();
    return {
      applied: apps.filter((a) => a.status === 'applied').length,
      phoneScreen: apps.filter((a) => a.status === 'phone-screen').length,
      interviewing: apps.filter((a) => a.status === 'interviewing').length,
      offer: apps.filter((a) => a.status === 'offer').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
      noReply: apps.filter((a) => a.status === 'saved').length,
    };
  });

  readonly applicationsByStatus = computed(() => {
    const apps = this.applications();
    return {
      saved: apps.filter((a) => a.status === 'saved'),
      applied: apps.filter((a) => a.status === 'applied'),
      phoneScreen: apps.filter((a) => a.status === 'phone-screen'),
      interviewing: apps.filter((a) => a.status === 'interviewing'),
      offer: apps.filter((a) => a.status === 'offer'),
      rejected: apps.filter((a) => a.status === 'rejected'),
    };
  });

  constructor() {
    effect(() => this.storage.save('subjects', this.subjects()));
    effect(() => this.storage.save('companies', this.companies()));
    effect(() => this.storage.save('applications', this.applications()));
    effect(() => this.storage.save('settings', this.settings()));
    effect(() => this.storage.save('streak', this.streak()));
  }

  /* ── Mutations ───────────────────────────────────────────────────────────── */

  setSubjectStatus(id: string, status: SubjectStatus): void {
    this.subjects.update((list) =>
      list.map((s) => (s.id === id ? { ...s, status } : s)),
    );
  }

  updateSubject(id: string, patch: Partial<Subject>): void {
    this.subjects.update((list) =>
      list.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }

  addNote(subjectId: string, note: Content): void {
    this.subjects.update((list) =>
      list.map((s) =>
        s.id === subjectId
          ? { ...s, content: [...(s.content ?? []), note] }
          : s,
      ),
    );
  }

  removeNote(subjectId: string, index: number): void {
    this.subjects.update((list) =>
      list.map((s) =>
        s.id === subjectId
          ? { ...s, content: s.content?.filter((_, i) => i !== index) }
          : s,
      ),
    );
  }

  addQA(subjectId: string, qa: QA): void {
    this.subjects.update((list) =>
      list.map((s) =>
        s.id === subjectId ? { ...s, qa: [...(s.qa ?? []), qa] } : s,
      ),
    );
  }

  removeQA(subjectId: string, index: number): void {
    this.subjects.update((list) =>
      list.map((s) =>
        s.id === subjectId
          ? { ...s, qa: s.qa?.filter((_, i) => i !== index) }
          : s,
      ),
    );
  }

  addApplication(app: Omit<Application, 'id'>): void {
    const id = `app-${Date.now()}`;
    this.applications.update((list) => [{ id, ...app }, ...list]);
  }

  setCompanyStatus(id: string, status: CompanyStatus): void {
    this.companies.update((list) =>
      list.map((c) => (c.id === id ? { ...c, status } : c)),
    );
  }

  updateDisplayName(name: string): void {
    this.settings.update((s) => ({ ...s, displayName: name }));
  }

  updateAccent(accent: UserSettings['accent']): void {
    this.settings.update((s) => ({ ...s, accent }));
  }
}
