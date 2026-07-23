import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import type { Subject, Company, Application } from '../models/jobmate.models';

export const GUEST_ITEM_LIMIT = 3;

function reviveDated<T extends { createdAt: Date; updatedAt: Date }>(item: T): T {
  return { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) };
}

function reviveSubject(subject: Subject): Subject {
  return {
    ...subject,
    createdAt: new Date(subject.createdAt),
    updatedAt: new Date(subject.updatedAt),
    lastReviewedAt: subject.lastReviewedAt ? new Date(subject.lastReviewedAt) : null,
    nextReviewAt: subject.nextReviewAt ? new Date(subject.nextReviewAt) : null,
    interviewedOn: (subject.interviewedOn ?? []).map(d => new Date(d)),
  };
}

/**
 * Two sample subjects shown to every first-time guest so the Subjects page
 * isn't empty. They count toward GUEST_ITEM_LIMIT like any other guest item —
 * a fresh guest starts with 1 free subject left, not 3.
 */
function buildSampleSubjects(): Subject[] {
  const now = new Date();
  const base = {
    userId: 'guest',
    priority: 'high' as const,
    status: 'not_started' as const,
    confidenceScore: 1,
    estimatedReadTime: null,
    tags: [],
    qa: [],
    sourceUrl: null,
    aiSummary: null,
    interviewedOn: [] as Date[],
    lastReviewedAt: null,
    nextReviewAt: null,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    companyTags: [],
    notes: [],
    codeSamples: [],
    resources: [],
  };
  return [
    {
      ...base,
      id: crypto.randomUUID(),
      title: 'RxJS',
      summary: 'Reactive extensions for JavaScript — observables, operators, and async data streams.',
      category: 'angular' as const,
    },
    {
      ...base,
      id: crypto.randomUUID(),
      title: 'Signals',
      summary: "Angular's fine-grained reactive primitive for local and shared state.",
      category: 'angular' as const,
    },
  ];
}

/**
 * Lets signed-out visitors create up to GUEST_ITEM_LIMIT of each entity so
 * they can try the product before signing up. Items live in localStorage
 * only; the owning store migrates them to Supabase on sign-up.
 */
@Injectable({ providedIn: 'root' })
export class GuestContentService {
  private readonly storage = inject(StorageService);

  private readonly _subjects = signal<Subject[]>(this.loadOrSeedSubjects());
  private readonly _companies = signal<Company[]>(
    (this.storage.load<Company[]>('guest_companies') ?? []).map(reviveDated),
  );
  private readonly _applications = signal<Application[]>(
    (this.storage.load<Application[]>('guest_applications') ?? []).map(reviveDated),
  );

  readonly subjects = this._subjects.asReadonly();
  readonly companies = this._companies.asReadonly();
  readonly applications = this._applications.asReadonly();

  private loadOrSeedSubjects(): Subject[] {
    const stored = this.storage.load<Subject[]>('guest_subjects');
    if (stored) return stored.map(reviveSubject);

    const seed = buildSampleSubjects();
    this.storage.save('guest_subjects', seed);
    return seed;
  }

  canAddSubject(): boolean {
    return this._subjects().length < GUEST_ITEM_LIMIT;
  }

  canAddCompany(): boolean {
    return this._companies().length < GUEST_ITEM_LIMIT;
  }

  canAddApplication(): boolean {
    return this._applications().length < GUEST_ITEM_LIMIT;
  }

  addSubject(subject: Subject): void {
    this._subjects.update(list => [subject, ...list]);
    this.storage.save('guest_subjects', this._subjects());
  }

  addCompany(company: Company): void {
    this._companies.update(list => [company, ...list]);
    this.storage.save('guest_companies', this._companies());
  }

  addApplication(application: Application): void {
    this._applications.update(list => [application, ...list]);
    this.storage.save('guest_applications', this._applications());
  }

  clearSubjects(): void {
    this._subjects.set([]);
    this.storage.clear('guest_subjects');
  }

  clearCompanies(): void {
    this._companies.set([]);
    this.storage.clear('guest_companies');
  }

  clearApplications(): void {
    this._applications.set([]);
    this.storage.clear('guest_applications');
  }
}
