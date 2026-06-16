import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import hljs from 'highlight.js';
import { StudyStore } from '../../../core/stores/study.store';
import type { SubjectPriority, SubjectStatus } from '../../../core/models/jobmate.models';
import { RichEditorComponent } from '../../../shared/components/rich-editor/rich-editor.component';
import { CodeThemeService } from '../../../core/services/code-theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { PosthogService } from '../../../core/services/posthog.service';

type SubjectTab = 'notes' | 'qa';

@Component({
  selector: 'app-subject-detail',
  templateUrl: './subject-detail.component.html',
  styleUrl: './subject-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RichEditorComponent],
})
export class SubjectDetailComponent {
  readonly id = input.required<string>();
  readonly store = inject(StudyStore);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly codeTheme = inject(CodeThemeService);
  private readonly posthog = inject(PosthogService);

  private requireAuth(): boolean {
    if (this.auth.isAuthenticated()) return true;
    this.router.navigate(['/auth']);
    return false;
  }

  readonly subject = computed(() => this.store.getById(this.id()));

  /* ── Tabs ─────────────────────────────────────────────────────────────────── */

  readonly tabs: { key: SubjectTab; label: string }[] = [
    { key: 'notes', label: 'Notes' },
    { key: 'qa', label: 'Q&A' },
  ];
  readonly activeTab = signal<SubjectTab>('notes');

  setTab(tab: SubjectTab): void {
    this.activeTab.set(tab);
  }

  /* ── Q&A accordion ───────────────────────────────────────────────────────── */

  readonly openQAIndex = signal<number | null>(null);

  toggleQA(i: number): void {
    this.openQAIndex.update(cur => cur === i ? null : i);
  }

  /* ── Notes ───────────────────────────────────────────────────────────────── */

  readonly noteHtml = signal('');
  readonly noteSaving = signal(false);
  readonly noteEditMode = signal(false);

  readonly processedNoteHtml = computed(() => {
    const html = this.noteHtml();
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll<HTMLElement>('pre code').forEach(block => {
      const lang = Array.from(block.classList)
        .find(c => c.startsWith('language-'))
        ?.replace('language-', '');
      try {
        const result = lang
          ? hljs.highlight(block.textContent ?? '', { language: lang }).value
          : hljs.highlightAuto(block.textContent ?? '').value;
        block.innerHTML = result;
        block.classList.add('hljs');
      } catch { /* unsupported language — leave as plain text */ }
    });
    return doc.body.innerHTML;
  });

  constructor() {
    afterNextRender(() => {
      const notes = this.subject()?.notes ?? [];
      if (notes.length > 0) this.noteHtml.set(notes[0].content);
    });
  }

  openNoteEdit(): void {
    const notes = this.subject()?.notes ?? [];
    if (notes.length > 0) this.noteHtml.set(notes[0].content);
    this.noteEditMode.set(true);
  }

  cancelNoteEdit(): void {
    const notes = this.subject()?.notes ?? [];
    this.noteHtml.set(notes.length > 0 ? notes[0].content : '');
    this.noteEditMode.set(false);
  }

  async saveNote(): Promise<void> {
    if (!this.requireAuth()) return;
    const html = this.noteHtml();
    if (!html) return;

    this.noteSaving.set(true);
    const sub = this.subject();
    if (!sub) { this.noteSaving.set(false); return; }

    if (sub.notes.length > 0) {
      await this.store.updateNote(sub.id, sub.notes[0].id, html);
    } else {
      await this.store.addNote(sub.id, html);
    }
    this.noteSaving.set(false);
    this.router.navigate(['/subjects']);
  }

  /* ── Edit mode ───────────────────────────────────────────────────────────── */

  readonly editMode = signal(false);
  readonly editTitle = signal('');
  readonly editSummary = signal('');
  readonly editStatus = signal<SubjectStatus>('not_started');
  readonly editPriority = signal<SubjectPriority>('medium');
  readonly editCompanies = signal<string[]>([]);
  readonly companyInput = signal('');

  readonly statusOptions: { value: SubjectStatus; label: string }[] = [
    { value: 'not_started', label: 'Not started' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'needs_review', label: 'Needs review' },
    { value: 'confident', label: 'Confident' },
    { value: 'mastered', label: 'Mastered' },
  ];

  readonly priorityOptions: { value: SubjectPriority; label: string }[] = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  openEdit(): void {
    const sub = this.subject();
    if (!sub) return;
    this.editTitle.set(sub.title);
    this.editSummary.set(sub.summary ?? '');
    this.editStatus.set(sub.status);
    this.editPriority.set(sub.priority);
    this.editCompanies.set(sub.companyTags.map(ct => ct.name));
    this.companyInput.set('');
    this.editMode.set(true);
  }

  async saveEdit(): Promise<void> {
    if (!this.requireAuth()) return;
    const sub = this.subject();
    const newStatus = this.editStatus();
    await this.store.updateSubject(this.id(), {
      title: this.editTitle(),
      summary: this.editSummary() || null,
      status: newStatus,
      priority: this.editPriority(),
    });
    if (sub && sub.status !== newStatus) {
      this.posthog.capture('subject_status_updated', {
        previous_status: sub.status,
        new_status: newStatus,
        subject_title: this.editTitle(),
        priority: this.editPriority(),
      });
    }
    this.editMode.set(false);
  }

  addCompany(): void {
    const val = this.companyInput().trim();
    if (val && !this.editCompanies().includes(val)) {
      this.editCompanies.update(list => [...list, val]);
    }
    this.companyInput.set('');
  }

  removeCompany(company: string): void {
    this.editCompanies.update(list => list.filter(c => c !== company));
  }

  /* ── Add Q&A form ────────────────────────────────────────────────────────── */

  readonly showQAForm = signal(false);
  readonly qaQuestion = signal('');
  readonly qaAnswer = signal('');
  readonly qaDifficulty = signal<'easy' | 'medium' | 'hard'>('medium');

  async submitQA(): Promise<void> {
    if (!this.requireAuth()) return;
    const question = this.qaQuestion().trim();
    const answer = this.qaAnswer().trim();
    if (!question || !answer) return;

    await this.store.addQA(this.id(), {
      question,
      answer,
      difficulty: this.qaDifficulty(),
    });

    this.posthog.capture('qa_added', {
      difficulty: this.qaDifficulty(),
      subject_title: this.subject()?.title ?? null,
      total_qa_count: (this.subject()?.qa.length ?? 0) + 1,
    });

    this.qaQuestion.set('');
    this.qaAnswer.set('');
    this.qaDifficulty.set('medium');
    this.showQAForm.set(false);
  }

  async removeQA(index: number): Promise<void> {
    if (!this.requireAuth()) return;
    await this.store.removeQA(this.id(), index);
  }

  /* ── CSS helpers ─────────────────────────────────────────────────────────── */

  statusClass(s: string): string {
    return `status-${s.replace('_', '-')}`;
  }

  priorityClass(p: string): string {
    return `priority-${p}`;
  }

  difficultyClass(d: string): string {
    return `diff-${d}`;
  }

  statusLabel(status: SubjectStatus): string {
    const map: Record<SubjectStatus, string> = {
      not_started: 'NOT STARTED',
      in_progress: 'IN PROGRESS',
      needs_review: 'NEEDS REVIEW',
      confident: 'CONFIDENT',
      mastered: 'MASTERED',
    };
    return map[status] ?? status;
  }

  answerParagraphs(answer: string): string[] {
    return answer.split('\n\n').filter(Boolean);
  }
}
