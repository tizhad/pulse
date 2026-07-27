import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AskAiService, type AiBrief, type AiOutlineSection, type AiSnippet } from '../../core/services/ask-ai.service';
import { StudyStore } from '../../core/stores/study.store';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { GuestContentService, GUEST_ITEM_LIMIT } from '../../core/services/guest-content.service';
import { PosthogService } from '../../core/services/posthog.service';
import type { SubjectCategory, SubjectPriority, SubjectStatus } from '../../core/models/jobmate.models';

type PageState = 'idle' | 'loading' | 'ready' | 'error';

const SUGGESTIONS = [
  'React reconciliation',
  'PostgreSQL indexes',
  'Kubernetes pods vs deployments',
  'TCP three-way handshake',
  'OAuth 2 vs OIDC',
  'Big-O of quicksort',
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderOutlineNote(outline: AiOutlineSection[]): string {
  return outline
    .map(
      (section) =>
        `<h3>${escapeHtml(section.title)}</h3><ul>${section.bullets
          .map((b) => `<li>${escapeHtml(b)}</li>`)
          .join('')}</ul>`,
    )
    .join('');
}

function renderCodeNote(snippet: AiSnippet): string {
  return `<pre><code>${escapeHtml(snippet.code)}</code></pre>`;
}

@Component({
  selector: 'app-ask-ai',
  templateUrl: './ask-ai.component.html',
  styleUrl: './ask-ai.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class AskAiComponent {
  private readonly askAi = inject(AskAiService);
  private readonly studyStore = inject(StudyStore);
  private readonly auth = inject(AuthService);
  private readonly authModal = inject(AuthModalService);
  private readonly guestContent = inject(GuestContentService);
  private readonly posthog = inject(PosthogService);

  readonly suggestions = SUGGESTIONS;

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
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  readonly statusOptions: { value: SubjectStatus; label: string }[] = [
    { value: 'not_started', label: 'Not started' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'needs_review', label: 'Needs review' },
    { value: 'confident', label: 'Confident' },
    { value: 'mastered', label: 'Mastered' },
  ];

  readonly query = signal('');
  readonly pageState = signal<PageState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<AiBrief | null>(null);
  readonly added = signal(false);
  readonly addedSubjectId = signal<string | null>(null);
  readonly saving = signal(false);

  readonly selectedCategory = signal<SubjectCategory>('javascript');
  readonly priority = signal<SubjectPriority>('high');
  readonly status = signal<SubjectStatus>('not_started');
  readonly includeOutline = signal(true);
  readonly includeQA = signal(true);
  readonly includeCompanies = signal(true);
  readonly includeCode = signal(true);

  readonly isGuest = () => !this.auth.isAuthenticated();

  private canCreateSubject(): boolean {
    if (this.auth.isAuthenticated()) return true;
    if (this.guestContent.canAddSubject()) return true;
    this.authModal.open(
      'signup',
      `You've added ${GUEST_ITEM_LIMIT} free subjects — sign up to keep building your study plan.`,
    );
    return false;
  }

  async ask(q: string): Promise<void> {
    const trimmed = q.trim();
    if (!trimmed) return;

    this.query.set(trimmed);
    this.pageState.set('loading');
    this.added.set(false);
    this.errorMessage.set(null);

    try {
      const brief = await this.askAi.generateBrief(trimmed);
      this.result.set(brief);
      this.selectedCategory.set(brief.category);
      this.pageState.set('ready');
      this.posthog.capture('ask_ai_query', { query: trimmed });
    } catch (err) {
      console.error('Ask AI request failed:', err);
      this.pageState.set('error');
      this.errorMessage.set('Something went wrong generating this brief. Please try again.');
    }
  }

  onSubmit(): void {
    this.ask(this.query());
  }

  onRegenerate(): void {
    const r = this.result();
    if (r) this.ask(this.query());
  }

  private getSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  setCategory(event: Event): void {
    this.selectedCategory.set(this.getSelectValue(event) as SubjectCategory);
  }

  setPriority(event: Event): void {
    this.priority.set(this.getSelectValue(event) as SubjectPriority);
  }

  setStatus(event: Event): void {
    this.status.set(this.getSelectValue(event) as SubjectStatus);
  }

  async onAdd(): Promise<void> {
    const r = this.result();
    if (!r || !this.canCreateSubject()) return;

    this.saving.set(true);
    const subject = await this.studyStore.addSubject({
      title: r.title,
      summary: r.summary,
      category: this.selectedCategory(),
      priority: this.priority(),
      status: this.status(),
      confidenceScore: 1,
      estimatedReadTime: null,
      tags: this.includeCompanies() ? r.askedBy : [],
      sourceUrl: null,
    });
    this.saving.set(false);
    if (!subject) return;

    if (this.includeQA()) {
      for (const q of r.questions) {
        await this.studyStore.addQA(subject.id, { question: q.q, answer: q.a });
      }
    }

    if (this.auth.isAuthenticated()) {
      if (this.includeOutline() && r.outline.length > 0) {
        await this.studyStore.addNote(subject.id, renderOutlineNote(r.outline));
      }
      if (this.includeCode() && r.snippet) {
        await this.studyStore.addNote(subject.id, renderCodeNote(r.snippet));
      }
    }

    this.addedSubjectId.set(subject.id);
    this.added.set(true);
    this.posthog.capture('ask_ai_subject_added', {
      category: this.selectedCategory(),
      qa_count: r.questions.length,
    });
  }
}
