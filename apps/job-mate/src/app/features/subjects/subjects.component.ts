import {
  ChangeDetectionStrategy,
  Component,
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
  SubjectCategory,
  SubjectPriority,
  SubjectStatus,
} from '../../core/models/jobmate.models';

type SortKey = 'title' | 'qa' | 'status' | 'priority';

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

  readonly sortKey = signal<SortKey>('priority');
  readonly showForm = signal(false);
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

  setSort(key: SortKey): void {
    this.sortKey.set(key);
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
}
