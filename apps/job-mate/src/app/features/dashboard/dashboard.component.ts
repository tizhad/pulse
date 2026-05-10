import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyStore } from '../../core/stores/study.store';
import { ApplicationStore } from '../../core/stores/application.store';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class DashboardComponent {
  readonly studyStore = inject(StudyStore);
  readonly appStore = inject(ApplicationStore);

  readonly pipelineRows = [
    { label: 'Applied',      key: 'applied',       color: 'var(--pipe-applied)' },
    { label: 'Phone screen', key: 'phone-screen',  color: 'var(--pipe-phone)' },
    { label: 'Interviewing', key: 'interviewing',  color: 'var(--pipe-interview)' },
    { label: 'Offer 🎉',     key: 'offer',         color: 'var(--pipe-offer)' },
    { label: 'Rejected',     key: 'rejected',      color: 'var(--pipe-rejected)' },
    { label: 'No reply',     key: 'saved',         color: 'var(--pipe-noreply)' },
  ] as const;

  readonly streakIntensities = [0.2, 0.5, 0.8, 0.6, 0, 0.4, 0.9, 1, 0.7, 0.5, 0.8, 0.6, 0.9, 1];

  readonly masteredCount = computed(() =>
    this.studyStore.subjects().filter(s => s.status === 'mastered').length,
  );

  readonly inProgressCount = computed(() =>
    this.studyStore.subjects().filter(s => s.status === 'in_progress').length,
  );

  readonly notStartedCount = computed(() =>
    this.studyStore.subjects().filter(s => s.status === 'not_started').length,
  );

  readonly progressPercent = computed(() => {
    const total = this.studyStore.subjects().length;
    if (!total) return 0;
    return Math.round((this.masteredCount() / total) * 100);
  });

  readonly ringOffset = computed(() => {
    const c = 2 * Math.PI * 42;
    return c - (this.progressPercent() / 100) * c;
  });

  readonly ringCircumference = 2 * Math.PI * 42;

  private readonly PRIORITY_ORDER: Record<string, number> = {
    critical: 0, high: 1, medium: 2, low: 3,
  };

  readonly todaysFocus = computed(() =>
    this.studyStore.subjects()
      .filter(s => s.status !== 'mastered')
      .sort((a, b) => (this.PRIORITY_ORDER[a.priority] ?? 99) - (this.PRIORITY_ORDER[b.priority] ?? 99))
      .slice(0, 5),
  );

  readonly recentApplications = computed(() =>
    this.appStore.applications().slice(0, 5),
  );

  readonly pipelineCounts = computed(() => {
    const apps = this.appStore.applications();
    const counts: Record<string, number> = {};
    for (const app of apps) {
      counts[app.status] = (counts[app.status] ?? 0) + 1;
    }
    return counts;
  });

  readonly maxPipelineCount = computed(() =>
    Math.max(...this.pipelineRows.map(r => this.pipelineCounts()[r.key] ?? 0), 1),
  );

  getPipelineCount(key: string): number {
    return this.pipelineCounts()[key] ?? 0;
  }

  getPipelineBarWidth(key: string): number {
    return Math.round((this.getPipelineCount(key) / this.maxPipelineCount()) * 100);
  }

  scoreFor(qaCount: number): number {
    return Math.min(99, 40 + qaCount * 6);
  }

  priorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      offer: 'pipe-offer', interviewing: 'pipe-interview', rejected: 'pipe-rejected',
      'phone-screen': 'pipe-phone', applied: 'pipe-applied', saved: 'pipe-saved',
    };
    return map[status] ?? 'pipe-saved';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      offer: 'Offer 🎉', interviewing: 'Interviewing', rejected: 'Rejected',
      'phone-screen': 'Phone screen', applied: 'Applied', saved: 'Saved',
    };
    return map[status] ?? status;
  }

  companyInitial(company: string): string {
    return company.charAt(0).toUpperCase();
  }
}
