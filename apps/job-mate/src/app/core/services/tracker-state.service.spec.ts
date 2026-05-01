import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import {
  TrackerStateService,
  CompanyStatus,
  FixUrgency,
} from './tracker-state.service';
import { StorageService } from './storage.service';

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

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      TrackerStateService,
      { provide: StorageService, useClass: StorageStub },
    ],
  });
  return TestBed.inject(TrackerStateService);
}

describe('TrackerStateService', () => {
  describe('toggleTask', () => {
    it('marks an undone task as done', () => {
      const svc = setup();
      const week = svc.weeks()[0];
      const task = week.tasks[0];
      expect(task.done).toBe(false);

      svc.toggleTask(week.id, task.id);

      const updated = svc.weeks()[0].tasks[0];
      expect(updated.done).toBe(true);
    });

    it('marks a done task back to undone', () => {
      const svc = setup();
      const week = svc.weeks()[0];
      const task = week.tasks[0];

      svc.toggleTask(week.id, task.id);
      svc.toggleTask(week.id, task.id);

      const updated = svc.weeks()[0].tasks[0];
      expect(updated.done).toBe(false);
    });

    it('does not affect tasks in other weeks', () => {
      const svc = setup();
      const week0 = svc.weeks()[0];
      const week1 = svc.weeks()[1];

      svc.toggleTask(week0.id, week0.tasks[0].id);

      expect(svc.weeks()[1].tasks[0].done).toBe(week1.tasks[0].done);
    });
  });

  describe('cycleStatus', () => {
    it('advances from not-applied to applied', () => {
      const svc = setup();
      const company = svc.companies()[0];
      expect(company.status).toBe(CompanyStatus.NotApplied);

      svc.cycleStatus(company.id);

      expect(svc.companies()[0].status).toBe(CompanyStatus.Applied);
    });

    it('cycles through all statuses back to not-applied', () => {
      const svc = setup();
      const company = svc.companies()[0];

      // 5 steps to complete the full cycle
      for (let i = 0; i < 5; i++) svc.cycleStatus(company.id);

      expect(svc.companies()[0].status).toBe(CompanyStatus.NotApplied);
    });

    it('does not affect other companies', () => {
      const svc = setup();
      const first = svc.companies()[0];
      const secondBefore = svc.companies()[1].status;

      svc.cycleStatus(first.id);

      expect(svc.companies()[1].status).toBe(secondBefore);
    });
  });

  describe('resolveFix', () => {
    it('marks a fix as resolved and sets urgency to Resolved', () => {
      const svc = setup();
      const fix = svc.fixes()[0];
      expect(fix.resolved).toBe(false);

      svc.resolveFix(fix.id);

      const updated = svc.fixes()[0];
      expect(updated.resolved).toBe(true);
      expect(updated.urgency).toBe(FixUrgency.Resolved);
    });

    it('does not affect other fixes', () => {
      const svc = setup();
      const secondBefore = svc.fixes()[1].resolved;

      svc.resolveFix(svc.fixes()[0].id);

      expect(svc.fixes()[1].resolved).toBe(secondBefore);
    });
  });
});
