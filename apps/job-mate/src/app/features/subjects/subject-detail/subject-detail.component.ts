import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { StateService } from '../../../core/services/state.service';
import {
  SubjectPriority,
  SubjectStatus,
} from '../../../core/models/jobmate.models';

type SubjectTab = 'notes' | 'qa';

@Component({
  selector: 'app-subject-detail',
  templateUrl: './subject-detail.component.html',
  styleUrl: './subject-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class SubjectDetailComponent {
  readonly id = input.required<string>();
  readonly state = inject(StateService);

  readonly subject = computed(() =>
    this.state.subjects().find((s) => s.id === this.id()),
  );

  /* ── Tabs ────────────────────────────────────────────────────────────────── */

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
    this.openQAIndex.update((cur) => (cur === i ? null : i));
  }

  /* ── Edit mode ───────────────────────────────────────────────────────────── */

  readonly editMode = signal(false);
  readonly editStatus = signal<SubjectStatus>('to-do');
  readonly editPriority = signal<SubjectPriority>('medium');
  readonly editPotential = signal<number>(5);
  readonly editCompanies = signal<string[]>([]);
  readonly companyInput = signal('');

  openEdit(): void {
    const sub = this.subject();
    if (!sub) return;
    this.editStatus.set(sub.status);
    this.editPriority.set(sub.priority);
    this.editPotential.set(sub.potential ?? 5);
    this.editCompanies.set([...(sub.companies ?? [])]);
    this.companyInput.set('');
    this.editMode.set(true);
  }

  saveEdit(): void {
    this.state.updateSubject(this.id(), {
      status: this.editStatus(),
      priority: this.editPriority(),
      potential: this.editPotential(),
      companies: [...this.editCompanies()],
    });
    this.editMode.set(false);
  }

  addCompany(): void {
    const val = this.companyInput().trim();
    if (val && !this.editCompanies().includes(val)) {
      this.editCompanies.update((list) => [...list, val]);
    }
    this.companyInput.set('');
  }

  removeCompany(company: string): void {
    this.editCompanies.update((list) => list.filter((c) => c !== company));
  }

  /* ── Add note form ───────────────────────────────────────────────────────── */

  readonly showNoteForm = signal(false);
  readonly noteTitle = signal('');
  readonly noteDesc = signal('');
  readonly noteCode = signal('');

  submitNote(): void {
    const title = this.noteTitle().trim();
    const description = this.noteDesc().trim();
    const code = this.noteCode().trim() || undefined;
    if (!title && !description) return;
    this.state.addNote(this.id(), { title, description, code });
    this.noteTitle.set('');
    this.noteDesc.set('');
    this.noteCode.set('');
    this.showNoteForm.set(false);
  }

  removeNote(i: number): void {
    this.state.removeNote(this.id(), i);
  }

  /* ── Add Q&A form ────────────────────────────────────────────────────────── */

  readonly showQAForm = signal(false);
  readonly qaQuestion = signal('');
  readonly qaAnswer = signal('');
  readonly qaDifficulty = signal<'easy' | 'medium' | 'hard'>('medium');

  submitQA(): void {
    const question = this.qaQuestion().trim();
    const answer = this.qaAnswer().trim();
    if (!question || !answer) return;
    this.state.addQA(this.id(), {
      question,
      answer,
      difficulty: this.qaDifficulty(),
    });
    this.qaQuestion.set('');
    this.qaAnswer.set('');
    this.qaDifficulty.set('medium');
    this.showQAForm.set(false);
  }

  removeQA(i: number): void {
    this.state.removeQA(this.id(), i);
  }

  /* ── CSS helpers ─────────────────────────────────────────────────────────── */

  statusClass(s: string): string {
    return `status-${s}`;
  }

  priorityClass(p: string): string {
    return `priority-${p}`;
  }

  difficultyClass(d: string): string {
    return `diff-${d}`;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      'in-progress': 'IN PROGRESS',
      done: 'DONE',
      'to-do': 'TO-DO',
    };
    return map[status] ?? status;
  }

  answerParagraphs(answer: string): string[] {
    return answer.split('\n\n').filter(Boolean);
  }
}
