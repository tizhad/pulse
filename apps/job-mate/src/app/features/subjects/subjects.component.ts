import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { StateService } from '../../core/services/state.service';
import {
  SubjectPriority,
  SubjectStatus,
} from '../../core/models/jobmate.models';
import { RichEditorComponent } from '../../shared/components/rich-editor/rich-editor.component';

type SortKey = 'name' | 'qa' | 'status' | 'priority';

@Component({
  selector: 'app-subjects',
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, RichEditorComponent],
})
export class SubjectsComponent {
  readonly state = inject(StateService);

  readonly sortKey = signal<SortKey>('priority');
  readonly showForm = signal(false);
  readonly notesHtml = signal('');
  readonly companies = signal<string[]>([]);

  readonly companyInput = new FormControl('', { nonNullable: true });

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    priority: new FormControl<SubjectPriority>('medium', { nonNullable: true }),
    status: new FormControl<SubjectStatus>('to-do', { nonNullable: true }),
  });

  readonly priorityOptions: { value: SubjectPriority; label: string }[] = [
    { value: 'critical', label: 'Critical' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  readonly statusOptions: { value: SubjectStatus; label: string }[] = [
    { value: 'to-do', label: 'To-do' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'done', label: 'Done' },
  ];

  setSort(key: SortKey): void {
    this.sortKey.set(key);
  }

  openForm(): void {
    this.form.reset({ priority: 'medium', status: 'to-do' });
    this.companies.set([]);
    this.companyInput.reset();
    this.notesHtml.set('');
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

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, priority, status } = this.form.getRawValue();
    this.state.addSubject({
      name,
      priority,
      status,
      companies: this.companies().length ? this.companies() : undefined,
      notes: this.notesHtml().trim() || undefined,
    });
    this.closeForm();
  }

  statusClass(status: SubjectStatus): string {
    return `status-${status}`;
  }

  statusLabel(status: SubjectStatus): string {
    const map: Record<SubjectStatus, string> = {
      'in-progress': 'IN PROGRESS',
      done: 'DONE',
      'to-do': 'TO-DO',
    };
    return map[status];
  }

  priorityClass(priority: string): string {
    return `priority-${priority}`;
  }
}
