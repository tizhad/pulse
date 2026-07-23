import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { StudyStore } from '../../core/stores/study.store';
import {
  Subject,
  SubjectCategory,
  SubjectPriority,
  SubjectStatus,
} from '../../core/models/jobmate.models';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { GuestContentService, GUEST_ITEM_LIMIT } from '../../core/services/guest-content.service';
import { PosthogService } from '../../core/services/posthog.service';

type CategoryGroup = {
  readonly category: SubjectCategory;
  readonly subjects: Subject[];
  readonly statusCounts: Partial<Record<SubjectStatus, number>>;
};

type SortKey = 'title' | 'qa' | 'status' | 'priority' | 'potential';

@Component({
  selector: 'app-subjects',
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule],
})
export class SubjectsComponent {
  readonly store = inject(StudyStore);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly authModal = inject(AuthModalService);
  private readonly guestContent = inject(GuestContentService);
  private readonly posthog = inject(PosthogService);

  private requireAuth(): boolean {
    if (this.auth.isAuthenticated()) return true;
    this.authModal.open();
    return false;
  }

  private canCreateSubject(): boolean {
    if (this.auth.isAuthenticated()) return true;
    if (this.guestContent.canAddSubject()) return true;
    this.authModal.open(
      'signup',
      `You've added ${GUEST_ITEM_LIMIT} free subjects — sign up to keep building your study plan.`,
    );
    return false;
  }

  readonly guestSubjectsRemaining = computed(() =>
    Math.max(0, GUEST_ITEM_LIMIT - this.guestContent.subjectsAddedCount()),
  );

  readonly isGuest = computed(() => !this.auth.isAuthenticated());

  readonly sortKey = signal<SortKey>('potential');
  readonly showForm = signal(false);
  readonly grouping = signal(false);

  readonly totalQA = computed(() =>
    this.store.filtered().reduce((n, s) => n + s.qa.length, 0)
  );

  private readonly sortLabels: Record<SortKey, string> = {
    potential: 'Potential',
    priority: 'Priority',
    title: 'Title',
    qa: 'Q&A Count',
    status: 'Status',
  };
  readonly sortLabel = computed(() => this.sortLabels[this.sortKey()]);

  private readonly PRIORITY_ORDER: Record<SubjectPriority, number> = {
    critical: 0, high: 1, medium: 2, low: 3,
  };
  private readonly STATUS_ORDER: Record<SubjectStatus, number> = {
    not_started: 0, in_progress: 1, needs_review: 2, confident: 3, mastered: 4,
  };

  readonly sorted = computed(() => {
    const key = this.sortKey();
    return [...this.store.filtered()].sort((a, b) => {
      switch (key) {
        case 'title':    return a.title.localeCompare(b.title);
        case 'qa':       return b.qa.length - a.qa.length;
        case 'status':   return this.STATUS_ORDER[a.status] - this.STATUS_ORDER[b.status];
        case 'priority':  return this.PRIORITY_ORDER[a.priority] - this.PRIORITY_ORDER[b.priority];
        case 'potential': return b.confidenceScore - a.confidenceScore;
      }
    });
  });
  readonly companies = signal<string[]>([]);
  readonly companyInput = new FormControl('', { nonNullable: true });

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    category: new FormControl<SubjectCategory>('angular', {
      nonNullable: true,
    }),
    priority: new FormControl<SubjectPriority>('critical', {
      nonNullable: true,
    }),
    status: new FormControl<SubjectStatus>('not_started', {
      nonNullable: true,
    }),
  });

  readonly categoryOptions: { value: SubjectCategory; label: string }[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'react', label: 'React' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'performance', label: 'Performance' },
    { value: 'testing', label: 'Testing' },
    { value: 'accessibility', label: 'Accessibility' },
    { value: 'system_design', label: 'System Design' },
    { value: 'css', label: 'CSS' },
    { value: 'soft_skills', label: 'Soft Skills' },
  ];

  readonly priorityOptions: { value: SubjectPriority; label: string }[] = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  readonly statusOptions: { value: SubjectStatus; label: string }[] = [
    { value: 'not_started', label: 'Not started' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'needs_review', label: 'Needs review' },
    { value: 'confident', label: 'Confident' },
    { value: 'mastered', label: 'Mastered' },
  ];

  private readonly CATEGORY_COLORS: Record<SubjectCategory, string> = {
    angular:       '#DD0031',
    react:         '#087EA4',
    javascript:    '#9B6B0F',
    typescript:    '#3178C6',
    performance:   '#7B3FA8',
    testing:       '#1A7A47',
    accessibility: '#00838F',
    system_design: '#2C3E50',
    css:           '#2645C4',
    soft_skills:   '#C0621A',
  };

  private readonly STATUS_DISPLAY_ORDER: SubjectStatus[] = [
    'mastered', 'confident', 'in_progress', 'needs_review', 'not_started',
  ];

  readonly groupedByCategory = computed((): CategoryGroup[] => {
    const map = new Map<SubjectCategory, Subject[]>();
    for (const s of this.store.filtered()) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return Array.from(map.entries())
      .map(([category, subjects]) => {
        const statusCounts: Partial<Record<SubjectStatus, number>> = {};
        for (const s of subjects) statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
        return { category, subjects, statusCounts };
      })
      .sort((a, b) => b.subjects.length - a.subjects.length);
  });

  setSort(key: SortKey): void {
    this.sortKey.set(key);
  }

  cycleSort(): void {
    const keys: SortKey[] = ['potential', 'priority', 'title', 'qa', 'status'];
    const idx = keys.indexOf(this.sortKey());
    this.sortKey.set(keys[(idx + 1) % keys.length]);
  }

  openForm(): void {
    this.form.reset({
      category: 'angular',
      priority: 'critical',
      status: 'not_started',
    });
    this.companies.set([]);
    this.companyInput.reset();
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  addCompany(): void {
    const val = this.companyInput.value.trim();
    if (val && !this.companies().includes(val)) {
      this.companies.update((c) => [...c, val]);
    }
    this.companyInput.reset();
  }

  removeCompany(name: string): void {
    this.companies.update((c) => c.filter((x) => x !== name));
  }

  onCompanyKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addCompany();
    }
  }

  async submit(): Promise<void> {
    if (!this.canCreateSubject()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { title, category, priority, status } = this.form.getRawValue();
    const subject = await this.store.addSubject({
      title,
      summary: null,
      category,
      priority,
      status,
      confidenceScore: 1,
      estimatedReadTime: null,
      tags: this.companies(),
      sourceUrl: null,
    });
    this.closeForm();
    if (subject) {
      this.posthog.capture('subject_created', {
        category,
        priority,
        status,
        companies_count: this.companies().length,
      });
      this.router.navigate(['/subjects', subject.id]);
    }
  }

  statusClass(status: SubjectStatus): string {
    return `status-${status.replace('_', '-')}`;
  }

  statusLabel(status: SubjectStatus): string {
    const map: Record<SubjectStatus, string> = {
      not_started: 'NOT STARTED',
      in_progress: 'IN PROGRESS',
      needs_review: 'NEEDS REVIEW',
      confident: 'CONFIDENT',
      mastered: 'MASTERED',
    };
    return map[status];
  }

  priorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  categoryLabel(category: SubjectCategory): string {
    return this.categoryOptions.find(o => o.value === category)?.label ?? category;
  }

  categoryColor(category: SubjectCategory): string {
    return this.CATEGORY_COLORS[category];
  }

  categoryInitial(category: SubjectCategory): string {
    return this.categoryLabel(category).charAt(0).toUpperCase();
  }

  statusEntries(counts: Partial<Record<SubjectStatus, number>>): { status: SubjectStatus; count: number }[] {
    return this.STATUS_DISPLAY_ORDER
      .filter(s => (counts[s] ?? 0) > 0)
      .map(s => ({ status: s, count: counts[s] ?? 0 }));
  }

  statusCountLabel(status: SubjectStatus): string {
    const map: Record<SubjectStatus, string> = {
      not_started:  'Not started',
      in_progress:  'In progress',
      needs_review: 'Needs review',
      confident:    'Confident',
      mastered:     'Mastered',
    };
    return map[status];
  }
}
