import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { GuestContentService, GUEST_ITEM_LIMIT } from './guest-content.service';
import { StorageService } from './storage.service';
import type { Subject, Company, Application } from '../models/jobmate.models';

// Minimal in-memory stub — avoids touching real localStorage in unit tests
class StorageStub {
  private store: Record<string, unknown> = {};
  load<T>(key: string): T | null {
    return (this.store[key] as T) ?? null;
  }
  save<T>(key: string, value: T): void {
    this.store[key] = value;
  }
  clear(key: string): void {
    delete this.store[key];
  }
}

function setup(storage = new StorageStub()) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      GuestContentService,
      { provide: StorageService, useValue: storage },
    ],
  });
  return { svc: TestBed.inject(GuestContentService), storage };
}

function makeSubject(id: string): Subject {
  return {
    id, userId: 'guest', title: `Subject ${id}`, summary: null, category: 'angular',
    priority: 'medium', status: 'not_started', confidenceScore: 1, estimatedReadTime: null,
    tags: [], qa: [], sourceUrl: null, aiSummary: null, interviewedOn: [],
    lastReviewedAt: null, nextReviewAt: null, isArchived: false,
    createdAt: new Date(), updatedAt: new Date(),
    companyTags: [], notes: [], codeSamples: [], resources: [],
  };
}

function makeCompany(id: string): Company {
  return { id, userId: 'guest', name: `Company ${id}`, category: 'Startup', status: 'saved', createdAt: new Date(), updatedAt: new Date() };
}

function makeApplication(id: string): Application {
  return {
    id, userId: 'guest', title: `App ${id}`, company: 'Acme', date: '2026-01-01',
    location: null, status: 'saved', salary: null, url: null, tags: [],
    createdAt: new Date(), updatedAt: new Date(),
  };
}

describe('GuestContentService', () => {
  it('seeds RxJS and Signals as sample subjects on a fresh guest, but companies/applications start empty', () => {
    const { svc } = setup();
    expect(svc.subjects().map(s => s.title)).toEqual(expect.arrayContaining(['RxJS', 'Signals']));
    expect(svc.subjects()).toHaveLength(2);
    expect(svc.companies()).toEqual([]);
    expect(svc.applications()).toEqual([]);
  });

  it('persists the seeded sample subjects to storage so they only seed once', () => {
    const { svc, storage } = setup();
    svc.subjects(); // trigger construction
    expect(storage.load<Subject[]>('guest_subjects')).toHaveLength(2);
  });

  it('does not count the 2 seeded sample subjects toward the limit — a fresh guest gets the full 3 free subjects', () => {
    const { svc } = setup();
    expect(svc.subjectsAddedCount()).toBe(0);
    for (let i = 0; i < GUEST_ITEM_LIMIT; i++) {
      expect(svc.canAddSubject()).toBe(true);
      svc.addSubject(makeSubject(`s${i}`));
    }
    expect(svc.canAddSubject()).toBe(false);
    expect(svc.subjectsAddedCount()).toBe(GUEST_ITEM_LIMIT);
    // 2 samples + 3 guest-added
    expect(svc.subjects()).toHaveLength(GUEST_ITEM_LIMIT + 2);
  });

  it('allows creation while under the limit and blocks at the limit', () => {
    const { svc } = setup();
    for (let i = 0; i < GUEST_ITEM_LIMIT; i++) {
      expect(svc.canAddCompany()).toBe(true);
      svc.addCompany(makeCompany(`c${i}`));
    }
    expect(svc.canAddCompany()).toBe(false);
    expect(svc.companies().length).toBe(GUEST_ITEM_LIMIT);
  });

  it('enforces the limit independently per entity type', () => {
    const { svc } = setup();
    svc.addSubject(makeSubject('s1'));
    expect(svc.canAddCompany()).toBe(true);
    expect(svc.canAddApplication()).toBe(true);
  });

  it('persists additions to storage', () => {
    const { svc, storage } = setup();
    svc.addCompany(makeCompany('c1'));
    expect(storage.load<Company[]>('guest_companies')).toHaveLength(1);
  });

  it('clearing empties the signal and storage', () => {
    const { svc, storage } = setup();
    svc.addApplication(makeApplication('a1'));
    svc.clearApplications();
    expect(svc.applications()).toEqual([]);
    expect(storage.load<Application[]>('guest_applications')).toBeNull();
  });

  it('revives Date fields for items loaded from storage', () => {
    const storage = new StorageStub();
    storage.save('guest_subjects', [makeSubject('s1')]);
    const { svc } = setup(storage);
    expect(svc.subjects()[0].createdAt).toBeInstanceOf(Date);
  });
});
