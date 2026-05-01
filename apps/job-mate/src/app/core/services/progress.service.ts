import { Injectable, computed, inject } from '@angular/core';
import { TrackerStateService, CompanyStatus } from './tracker-state.service';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly state = inject(TrackerStateService);

  // ── Overall task progress ──────────────────────────────────────────────────

  readonly totalTasks = computed(() =>
    this.state.weeks().reduce((sum, w) => sum + w.tasks.length, 0),
  );

  readonly doneTasks = computed(() =>
    this.state.weeks().reduce(
      (sum, w) => sum + w.tasks.filter((t) => t.done).length,
      0,
    ),
  );

  readonly taskPercent = computed(() => {
    const total = this.totalTasks();
    return total === 0 ? 0 : Math.round((this.doneTasks() / total) * 100);
  });

  // ── Per-week progress ─────────────────────────────────────────────────────

  readonly weekPercents = computed(() =>
    this.state.weeks().map((week) => {
      const total = week.tasks.length;
      const done = week.tasks.filter((t) => t.done).length;
      return {
        weekId: week.id,
        percent: total === 0 ? 0 : Math.round((done / total) * 100),
      };
    }),
  );

  // ── Companies ─────────────────────────────────────────────────────────────

  readonly companiesApplied = computed(
    () =>
      this.state.companies().filter(
        (c) => c.status !== CompanyStatus.NotApplied,
      ).length,
  );

  readonly interviewsScheduled = computed(
    () =>
      this.state.companies().filter((c) => c.status === CompanyStatus.Interview)
        .length,
  );

  // ── Resume fixes ──────────────────────────────────────────────────────────

  readonly totalFixes = computed(() => this.state.fixes().length);

  readonly resolvedFixes = computed(
    () => this.state.fixes().filter((f) => f.resolved).length,
  );

  readonly fixPercent = computed(() => {
    const total = this.totalFixes();
    return total === 0 ? 0 : Math.round((this.resolvedFixes() / total) * 100);
  });
}
