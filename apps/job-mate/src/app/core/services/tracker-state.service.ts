import { Injectable, signal, effect, inject } from '@angular/core';
import {
  StudyWeek,
  Company,
  ResumeFix,
  CompanyStatus,
  FixUrgency,
} from '../models/tracker.models';
import { StorageService } from './storage.service';
import { STUDY_WEEKS, COMPANIES, RESUME_FIXES } from '../../data/tracker.data';

export type { StudyTask, StudyWeek, Company, ResumeFix } from '../models/tracker.models';
export { TaskTag, CompanyStatus, FixUrgency } from '../models/tracker.models';

// Status cycle order for advancing company state
const STATUS_CYCLE: CompanyStatus[] = [
  CompanyStatus.NotApplied,
  CompanyStatus.Applied,
  CompanyStatus.Interview,
  CompanyStatus.Offer,
  CompanyStatus.Rejected,
];

@Injectable({ providedIn: 'root' })
export class TrackerStateService {
  // inject() fields initialize top-to-bottom, so storage is ready before the signals below
  private readonly storage = inject(StorageService);

  // Initialise from persisted storage, falling back to seed data
  readonly weeks = signal<StudyWeek[]>(
    this.storage.load<StudyWeek[]>('weeks') ?? STUDY_WEEKS,
  );

  readonly companies = signal<Company[]>(
    this.storage.load<Company[]>('companies') ?? COMPANIES,
  );

  readonly fixes = signal<ResumeFix[]>(
    this.storage.load<ResumeFix[]>('fixes') ?? RESUME_FIXES,
  );

  constructor() {
    // Persist every signal change to localStorage
    effect(() => this.storage.save('weeks', this.weeks()));
    effect(() => this.storage.save('companies', this.companies()));
    effect(() => this.storage.save('fixes', this.fixes()));
  }

  // ── Study plan ─────────────────────────────────────────────────────────────

  toggleTask(weekId: string, taskId: string): void {
    this.weeks.update((weeks) =>
      weeks.map((week) =>
        week.id !== weekId
          ? week
          : {
              ...week,
              tasks: week.tasks.map((task) =>
                task.id !== taskId ? task : { ...task, done: !task.done },
              ),
            },
      ),
    );
  }

  // ── Companies ──────────────────────────────────────────────────────────────

  /** Advances the company status one step around the cycle. */
  cycleStatus(companyId: string): void {
    this.companies.update((companies) =>
      companies.map((company) => {
        if (company.id !== companyId) return company;
        const currentIndex = STATUS_CYCLE.indexOf(company.status);
        const nextStatus =
          STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
        return { ...company, status: nextStatus };
      }),
    );
  }

  // ── Resume fixes ───────────────────────────────────────────────────────────

  resolveFix(fixId: string): void {
    this.fixes.update((fixes) =>
      fixes.map((fix) =>
        fix.id !== fixId
          ? fix
          : { ...fix, resolved: true, urgency: FixUrgency.Resolved },
      ),
    );
  }
}
