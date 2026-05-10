import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApplicationStore } from '../../core/stores/application.store';
import { Application, AppStatus } from '../../core/models/jobmate.models';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class ApplicationsComponent {
  readonly store = inject(ApplicationStore);

  readonly applicationsByStatus = computed(() => {
    const apps = this.store.applications();
    return {
      saved: apps.filter(a => a.status === 'saved'),
      applied: apps.filter(a => a.status === 'applied'),
      phoneScreen: apps.filter(a => a.status === 'phone-screen'),
      interviewing: apps.filter(a => a.status === 'interviewing'),
      offer: apps.filter(a => a.status === 'offer'),
      rejected: apps.filter(a => a.status === 'rejected'),
    };
  });

  readonly columns: { key: string; label: string }[] = [
    { key: 'saved', label: 'Saved' },
    { key: 'applied', label: 'Applied' },
    { key: 'phoneScreen', label: 'Phone screen' },
    { key: 'interviewing', label: 'Interviewing' },
    { key: 'offer', label: 'Offer 🎉' },
    { key: 'rejected', label: 'Rejected' },
  ];

  readonly statusOptions: { value: AppStatus; label: string }[] = [
    { value: 'saved', label: 'Saved' },
    { value: 'applied', label: 'Applied' },
    { value: 'phone-screen', label: 'Phone screen' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejected', label: 'Rejected' },
  ];

  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly tags = signal<string[]>([]);

  readonly tagInput = new FormControl('', { nonNullable: true });

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    company: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    location: new FormControl('', { nonNullable: true }),
    status: new FormControl<AppStatus>('saved', { nonNullable: true }),
    date: new FormControl(this.todayLabel(), { nonNullable: true }),
    salary: new FormControl('', { nonNullable: true }),
  });

  openForm(): void {
    this.form.reset();
    this.tags.set([]);
    this.tagInput.reset();
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  addTag(): void {
    const tag = this.tagInput.value.trim();
    if (tag && !this.tags().includes(tag)) {
      this.tags.update((t) => [...t, tag]);
    }
    this.tagInput.reset();
  }

  removeTag(tag: string): void {
    this.tags.update((t) => t.filter((x) => x !== tag));
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    const { title, company, location, status, date, salary } = this.form.getRawValue();
    await this.store.addApplication({
      title,
      company,
      location: location.trim() || null,
      status,
      date,
      salary: salary.trim() || null,
      tags: this.tags(),
    });
    this.saving.set(false);
    this.closeForm();
  }

  colApps(key: string): Application[] {
    return (this.applicationsByStatus() as Record<string, Application[]>)[key] ?? [];
  }

  colClass(key: string): string {
    const map: Record<string, string> = {
      saved: 'col-saved',
      applied: 'col-applied',
      phoneScreen: 'col-phone',
      interviewing: 'col-interview',
      offer: 'col-offer',
      rejected: 'col-rejected',
    };
    return map[key] ?? '';
  }

  initial(company: string): string {
    return company.charAt(0).toUpperCase();
  }

  statusClass(status: AppStatus): string {
    const map: Record<AppStatus, string> = {
      saved: 'pipe-saved',
      applied: 'pipe-applied',
      'phone-screen': 'pipe-phone',
      interviewing: 'pipe-interview',
      offer: 'pipe-offer',
      rejected: 'pipe-rejected',
    };
    return map[status];
  }

  private todayLabel(): string {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
