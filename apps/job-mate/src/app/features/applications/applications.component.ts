import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { ApplicationStore } from '../../core/stores/application.store';
import { SettingsStore } from '../../core/stores/settings.store';
import { StudyStore } from '../../core/stores/study.store';
import { Application, AppStatus, SubjectCategory } from '../../core/models/jobmate.models';
import { JobAnalysisService, JobAnalysis } from '../../core/services/job-analysis.service';

type SortKey = 'createdAt' | 'date' | 'updatedAt' | 'status' | 'title' | 'company';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<AppStatus, number> = {
  saved: 0,
  applied: 1,
  'phone-screen': 2,
  interviewing: 3,
  offer: 4,
  rejected: 5,
};

const AVATAR_PALETTE: ReadonlyArray<{ bg: string; color: string }> = [
  { bg: '#1E7A47', color: '#ffffff' },
  { bg: '#6B32B8', color: '#ffffff' },
  { bg: '#1E5FA8', color: '#ffffff' },
  { bg: '#B02B23', color: '#ffffff' },
  { bg: '#2C3E50', color: '#ffffff' },
  { bg: '#C0621A', color: '#ffffff' },
  { bg: '#00838F', color: '#ffffff' },
  { bg: '#A07C10', color: '#ffffff' },
];

const SKILL_CATEGORY: Record<string, SubjectCategory> = {
  'Angular': 'angular',   'RxJS': 'angular',
  'React': 'react',       'Vue': 'react',
  'JavaScript': 'javascript',
  'TypeScript': 'typescript',
  'CSS/SCSS': 'css',
  'Testing': 'testing',
  'Performance': 'performance',
  'Accessibility': 'accessibility',
  'System Design': 'system_design',
  'Soft Skills': 'soft_skills', 'Agile/Scrum': 'soft_skills',
};

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
})
export class ApplicationsComponent {
  readonly store = inject(ApplicationStore);
  readonly settingsStore = inject(SettingsStore);
  private readonly studyStore = inject(StudyStore);
  private readonly analysisService = inject(JobAnalysisService);

  /* ── Sort ─────────────────────────────────────────────────────────────── */

  readonly sortKey = signal<SortKey>('createdAt');
  readonly sortDir = signal<SortDir>('desc');

  readonly sortOptions: { key: SortKey; label: string }[] = [
    { key: 'createdAt', label: 'Created' },
    { key: 'date', label: 'Applied' },
    { key: 'updatedAt', label: 'Updated' },
    { key: 'status', label: 'Status' },
    { key: 'title', label: 'Title' },
    { key: 'company', label: 'Company' },
  ];

  readonly sortedApplications = computed(() => {
    const apps = [...this.store.applications()];
    const key = this.sortKey();
    const mul = this.sortDir() === 'asc' ? 1 : -1;

    return apps.sort((a, b) => {
      switch (key) {
        case 'createdAt':
          return mul * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case 'updatedAt':
          return mul * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        case 'date':
          return mul * (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
        case 'status':
          return mul * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
        case 'title':
          return mul * a.title.localeCompare(b.title);
        case 'company':
          return mul * a.company.localeCompare(b.company);
      }
    });
  });

  setSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set(key === 'createdAt' || key === 'date' || key === 'updatedAt' ? 'desc' : 'asc');
    }
  }

  /* ── Status options ────────────────────────────────────────────────────── */

  readonly statusOptions: { value: AppStatus; label: string }[] = [
    { value: 'saved', label: 'Saved' },
    { value: 'applied', label: 'Applied' },
    { value: 'phone-screen', label: 'Phone screen' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'offer', label: 'Offer 🎉' },
    { value: 'rejected', label: 'Rejected' },
  ];

  /* ── Add drawer ────────────────────────────────────────────────────────── */

  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly tags = signal<string[]>([]);
  readonly tagInput = new FormControl('', { nonNullable: true });

  // Analysis state
  readonly linkedinUrl = new FormControl('', { nonNullable: true });
  readonly analyzing = signal(false);
  readonly analyzeError = signal<string | null>(null);
  readonly analysis = signal<JobAnalysis | null>(null);
  readonly pasteMode = signal(false);
  readonly pasteText = new FormControl('', { nonNullable: true });

  // Study plan state
  readonly addedSkills = signal<ReadonlySet<string>>(new Set());
  readonly addingSkill = signal<string | null>(null);
  readonly studyPlanMessage = signal<string | null>(null);
  private studyPlanTimer: ReturnType<typeof setTimeout> | null = null;

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    company: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    location: new FormControl('', { nonNullable: true }),
    status: new FormControl<AppStatus>('saved', { nonNullable: true }),
    date: new FormControl(this.todayIso(), { nonNullable: true }),
    salary: new FormControl('', { nonNullable: true }),
  });

  openForm(): void {
    this.form.reset({ date: this.todayIso(), status: 'saved' });
    this.tags.set([]);
    this.tagInput.reset();
    this.linkedinUrl.reset();
    this.analysis.set(null);
    this.analyzeError.set(null);
    this.analyzing.set(false);
    this.pasteMode.set(false);
    this.pasteText.reset();
    this.addedSkills.set(new Set());
    this.addingSkill.set(null);
    this.studyPlanMessage.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  async analyze(): Promise<void> {
    const url = this.linkedinUrl.value.trim();
    if (!url) return;
    this.analyzing.set(true);
    this.analyzeError.set(null);
    this.analysis.set(null);
    try {
      const result = await this.analysisService.fetchAndAnalyze(url);
      this.analysis.set(result);
      this.autofillForm(result);
    } catch {
      this.analyzeError.set('Could not fetch the job post. Try pasting the description below.');
    } finally {
      this.analyzing.set(false);
    }
  }

  analyzeFromPaste(): void {
    const text = this.pasteText.value.trim();
    if (!text) return;
    const result = this.analysisService.analyzeText(text);
    this.analysis.set(result);
    this.autofillForm(result);
    this.analyzeError.set(null);
  }

  private autofillForm(result: JobAnalysis): void {
    if (result.jobTitle && !this.form.controls.title.value)
      this.form.controls.title.setValue(result.jobTitle);
    if (result.company && !this.form.controls.company.value)
      this.form.controls.company.setValue(result.company);
    if (result.location && !this.form.controls.location.value)
      this.form.controls.location.setValue(result.isRemote ? 'Remote' : result.location);
    if (result.salaryRange && !this.form.controls.salary.value)
      this.form.controls.salary.setValue(result.salaryRange);
  }

  /* ── Skill checklist helpers ───────────────────────────────────────────── */

  isSkillFound(skillName: string): boolean {
    const analysis = this.analysis();
    if (analysis?.matchedSkills.some(m => m.name === skillName)) return true;
    const resume = this.settingsStore.settings()?.resume;
    if (resume) return resume.skills.includes(skillName);
    return this.studyStore.subjects().some(
      s => s.title.toLowerCase() === skillName.toLowerCase(),
    );
  }

  async addToStudyPlan(skillName: string): Promise<void> {
    if (this.addedSkills().has(skillName) || this.addingSkill()) return;
    this.addingSkill.set(skillName);
    const result = await this.studyStore.addSubject({
      title: skillName,
      summary: null,
      category: SKILL_CATEGORY[skillName] ?? 'javascript',
      priority: 'medium',
      status: 'not_started',
      confidenceScore: 0,
      estimatedReadTime: null,
      tags: [],
      sourceUrl: null,
    });
    this.addingSkill.set(null);
    if (result) {
      this.addedSkills.update(s => new Set([...s, skillName]));
      if (this.studyPlanTimer) clearTimeout(this.studyPlanTimer);
      this.studyPlanMessage.set(skillName);
      this.studyPlanTimer = setTimeout(() => this.studyPlanMessage.set(null), 5000);
    }
  }

  recommendationLabel(rec: JobAnalysis['recommendation']): string {
    const map: Record<JobAnalysis['recommendation'], string> = {
      'strong':        'Strong match — go for it',
      'worth-trying':  'Worth applying',
      'prepare-first': 'Prepare first',
      'not-ready':     'Significant gap',
      'no-data':       'Could not detect skills',
    };
    return map[rec];
  }

  addTag(): void {
    const tag = this.tagInput.value.trim();
    if (tag && !this.tags().includes(tag)) this.tags.update((t) => [...t, tag]);
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
    const { title, company, location, status, date, salary } =
      this.form.getRawValue();
    await this.store.addApplication({
      title,
      company,
      location: location.trim() || null,
      status,
      date,
      salary: salary.trim() || null,
      url: this.linkedinUrl.value.trim() || null,
      tags: this.tags(),
    });
    this.saving.set(false);
    this.closeForm();
  }

  /* ── Edit modal ────────────────────────────────────────────────────────── */

  readonly selectedApp = signal<Application | null>(null);
  readonly editTags = signal<string[]>([]);
  readonly editTagInput = new FormControl('', { nonNullable: true });

  readonly editForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    company: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    location: new FormControl('', { nonNullable: true }),
    status: new FormControl<AppStatus>('saved', { nonNullable: true }),
    date: new FormControl('', { nonNullable: true }),
    salary: new FormControl('', { nonNullable: true }),
  });

  openModal(app: Application): void {
    this.editForm.reset({
      title: app.title,
      company: app.company,
      location: app.location ?? '',
      status: app.status,
      date: app.date,
      salary: app.salary ?? '',
    });
    this.editTags.set([...app.tags]);
    this.editTagInput.reset();
    this.selectedApp.set(app);
  }

  closeModal(): void {
    this.selectedApp.set(null);
  }

  addEditTag(): void {
    const tag = this.editTagInput.value.trim();
    if (tag && !this.editTags().includes(tag))
      this.editTags.update((t) => [...t, tag]);
    this.editTagInput.reset();
  }

  removeEditTag(tag: string): void {
    this.editTags.update((t) => t.filter((x) => x !== tag));
  }

  onEditTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addEditTag();
    }
  }

  async saveModal(): Promise<void> {
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) return;
    const app = this.selectedApp();
    if (!app) return;
    this.saving.set(true);
    const { title, company, location, status, date, salary } =
      this.editForm.getRawValue();
    await this.store.updateApplication(app.id, {
      title: title.trim(),
      company: company.trim(),
      location: location.trim() || null,
      status,
      date,
      salary: salary.trim() || null,
      tags: this.editTags(),
    });
    this.saving.set(false);
    this.closeModal();
  }

  /* ── Helpers ───────────────────────────────────────────────────────────── */

  initial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  avatarBg(name: string): string {
    return AVATAR_PALETTE[this.nameHash(name) % AVATAR_PALETTE.length].bg;
  }

  avatarColor(name: string): string {
    return AVATAR_PALETTE[this.nameHash(name) % AVATAR_PALETTE.length].color;
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

  statusLabel(status: AppStatus): string {
    const map: Record<AppStatus, string> = {
      saved: 'Saved',
      applied: 'Applied',
      'phone-screen': 'Phone screen',
      interviewing: 'Interviewing',
      offer: 'Offer 🎉',
      rejected: 'Rejected',
    };
    return map[status];
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  private nameHash(name: string): number {
    let h = 0;
    for (let i = 0; i < name.length; i++)
      h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff;
    return h;
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
