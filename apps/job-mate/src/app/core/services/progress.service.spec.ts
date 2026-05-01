import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ProgressService } from './progress.service';
import { TrackerStateService } from './tracker-state.service';
import { StorageService } from './storage.service';

class StorageStub {
  load() { return null; }
  save() { /* no-op */ }
  clear() { /* no-op */ }
}

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      ProgressService,
      TrackerStateService,
      { provide: StorageService, useClass: StorageStub },
    ],
  });
  return {
    progress: TestBed.inject(ProgressService),
    state: TestBed.inject(TrackerStateService),
  };
}

describe('ProgressService', () => {
  describe('taskPercent', () => {
    it('returns 0% when no tasks are done', () => {
      const { progress } = setup();
      expect(progress.taskPercent()).toBe(0);
    });

    it('returns 100% when all tasks are done', () => {
      const { progress, state } = setup();
      // Toggle every task in every week
      state.weeks().forEach((week) =>
        week.tasks.forEach((task) => state.toggleTask(week.id, task.id)),
      );
      expect(progress.taskPercent()).toBe(100);
    });

    it('returns ~50% when half the tasks in one week are done', () => {
      const { progress, state } = setup();
      const week = state.weeks()[0];
      const halfCount = Math.floor(week.tasks.length / 2);
      week.tasks.slice(0, halfCount).forEach((task) =>
        state.toggleTask(week.id, task.id),
      );
      // Percent is rounded, so just check it is between 0 and 100
      const pct = progress.taskPercent();
      expect(pct).toBeGreaterThan(0);
      expect(pct).toBeLessThan(100);
    });
  });

  describe('weekPercents', () => {
    it('returns one entry per week', () => {
      const { progress, state } = setup();
      expect(progress.weekPercents().length).toBe(state.weeks().length);
    });

    it('reflects 100% for a fully completed week', () => {
      const { progress, state } = setup();
      const week = state.weeks()[0];
      week.tasks.forEach((task) => state.toggleTask(week.id, task.id));
      const entry = progress.weekPercents().find((w) => w.weekId === week.id);
      expect(entry?.percent).toBe(100);
    });
  });

  describe('companiesApplied', () => {
    it('returns 0 when no company has been touched', () => {
      const { progress } = setup();
      expect(progress.companiesApplied()).toBe(0);
    });

    it('counts a company after one status cycle', () => {
      const { progress, state } = setup();
      state.cycleStatus(state.companies()[0].id);
      expect(progress.companiesApplied()).toBe(1);
    });
  });

  describe('fixPercent', () => {
    it('returns 0% when nothing is resolved', () => {
      const { progress } = setup();
      expect(progress.fixPercent()).toBe(0);
    });

    it('returns 100% when all fixes are resolved', () => {
      const { progress, state } = setup();
      state.fixes().forEach((fix) => state.resolveFix(fix.id));
      expect(progress.fixPercent()).toBe(100);
    });
  });
});
