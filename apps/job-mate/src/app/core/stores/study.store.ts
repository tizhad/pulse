import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import {
  fromSubjectRow, toSubjectInsert,
  fromCompanyTagRow, fromStudyNoteRow, fromCodeSampleRow, fromResourceRow,
} from '../models/mappers';
import type { Subject, StudyFilters } from '../models/jobmate.models';
import type { Database, Json } from '../models/database.types';

const NEXT_REVIEW_DAYS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

@Injectable({ providedIn: 'root' })
export class StudyStore {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private readonly _subjects = signal<Subject[]>([]);
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);

  readonly subjects = this._subjects.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly filters = signal<StudyFilters>({
    category: null, status: null, priority: null, company: null, search: '',
  });

  readonly filtered = computed(() => {
    const f = this.filters();
    return this._subjects().filter(s => {
      if (f.category && s.category !== f.category) return false;
      if (f.status && s.status !== f.status) return false;
      if (f.priority && s.priority !== f.priority) return false;
      if (f.company && !s.companyTags.some(c => c.name === f.company)) return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        if (!s.title.toLowerCase().includes(q) && !s.tags.some(t => t.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  });

  readonly stats = computed(() => {
    const list = this._subjects();
    return {
      total: list.length,
      mastered: list.filter(s => s.status === 'mastered').length,
      needsReview: list.filter(s => s.status === 'needs_review').length,
      dueForReview: list.filter(s => s.nextReviewAt && s.nextReviewAt <= new Date()).length,
    };
  });

  constructor() {
    effect(() => {
      if (this.auth.user()) {
        this.load();
      } else {
        this._subjects.set([]);
        this._loaded.set(false);
      }
    });
  }

  async load(): Promise<void> {
    if (this._loaded()) return;
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this._loading.set(true);

    const [subjectsRes, tagsRes, notesRes, samplesRes, resourcesRes] = await Promise.all([
      this.supabase.client.from('study_subjects').select('*').eq('user_id', userId).eq('is_archived', false),
      this.supabase.client.from('subject_companies').select('*').eq('user_id', userId),
      this.supabase.client.from('subject_notes').select('*').eq('user_id', userId),
      this.supabase.client.from('subject_code_samples').select('*').eq('user_id', userId),
      this.supabase.client.from('subject_resources').select('*').eq('user_id', userId),
    ]);

    if (!subjectsRes.error && subjectsRes.data) {
      const subjects = subjectsRes.data.map(row =>
        fromSubjectRow(row, {
          companyTags: (tagsRes.data ?? []).filter(t => t.subject_id === row.id),
          notes: (notesRes.data ?? []).filter(n => n.subject_id === row.id),
          codeSamples: (samplesRes.data ?? []).filter(c => c.subject_id === row.id),
          resources: (resourcesRes.data ?? []).filter(r => r.subject_id === row.id),
        }),
      );
      this._subjects.set(subjects);
      this._loaded.set(true);
    }

    this._loading.set(false);
  }

  async addSubject(
    data: Parameters<typeof toSubjectInsert>[0],
  ): Promise<Subject | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

    const payload = toSubjectInsert(data, userId);
    const { data: row, error } = await this.supabase.client.from('study_subjects').insert(payload).select().single();
    if (error || !row) return null;

    const subject = fromSubjectRow(row);
    this._subjects.update(list => [subject, ...list]);
    return subject;
  }

  async updateSubject(id: string, patch: Partial<Pick<Subject,
    'title' | 'summary' | 'category' | 'priority' | 'status' |
    'confidenceScore' | 'estimatedReadTime' | 'tags' | 'sourceUrl' | 'isArchived'
  >>): Promise<void> {
    const prev = this._subjects();
    this._subjects.update(list => list.map(s => s.id === id ? { ...s, ...patch } : s));

    type SubjectUpdate = Database['public']['Tables']['study_subjects']['Update'];
    const dbPatch: SubjectUpdate = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.summary !== undefined) dbPatch.summary = patch.summary ?? null;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.confidenceScore !== undefined) dbPatch.confidence_score = patch.confidenceScore;
    if (patch.estimatedReadTime !== undefined) dbPatch.estimated_read_time = patch.estimatedReadTime ?? null;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;
    if (patch.sourceUrl !== undefined) dbPatch.source_url = patch.sourceUrl ?? null;
    if (patch.isArchived !== undefined) dbPatch.is_archived = patch.isArchived;

    const { error } = await this.supabase.client.from('study_subjects').update(dbPatch).eq('id', id);
    if (error) this._subjects.set(prev);
  }

  async updateConfidence(id: string, score: 1 | 2 | 3 | 4 | 5): Promise<void> {
    const days = NEXT_REVIEW_DAYS[score];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + days);

    const prev = this._subjects();
    this._subjects.update(list =>
      list.map(s => s.id === id ? { ...s, confidenceScore: score, nextReviewAt: nextReview, lastReviewedAt: new Date() } : s),
    );

    const { error } = await this.supabase.client.from('study_subjects').update({
      confidence_score: score,
      next_review_at: nextReview.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) this._subjects.set(prev);
  }

  async deleteSubject(id: string): Promise<void> {
    const prev = this._subjects();
    this._subjects.update(list => list.filter(s => s.id !== id));
    const { error } = await this.supabase.client.from('study_subjects').delete().eq('id', id);
    if (error) this._subjects.set(prev);
  }

  async addQA(id: string, qa: import('../models/jobmate.models').QA): Promise<void> {
    const sub = this.getById(id);
    if (!sub) return;
    const updatedQA = [...sub.qa, qa];
    const prev = this._subjects();
    this._subjects.update(list => list.map(s => s.id === id ? { ...s, qa: updatedQA } : s));
    const { error } = await this.supabase.client.from('study_subjects').update({ qa: updatedQA as never }).eq('id', id);
    if (error) this._subjects.set(prev);
  }

  async addNote(subjectId: string, content: string): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const { data, error } = await this.supabase.client
      .from('subject_notes')
      .insert({ subject_id: subjectId, user_id: userId, content: content as unknown as Json })
      .select()
      .single();

    if (!error && data) {
      const note = fromStudyNoteRow(data);
      this._subjects.update(list =>
        list.map(s => s.id === subjectId ? { ...s, notes: [...s.notes, note] } : s),
      );
    }
  }

  async updateNote(subjectId: string, noteId: string, content: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('subject_notes')
      .update({ content: content as unknown as Json })
      .eq('id', noteId);

    if (!error) {
      this._subjects.update(list =>
        list.map(s => s.id === subjectId ? {
          ...s,
          notes: s.notes.map(n => n.id === noteId ? { ...n, content, updatedAt: new Date() } : n),
        } : s),
      );
    }
  }

  async deleteNote(subjectId: string, noteId: string): Promise<void> {
    const prev = this._subjects();
    this._subjects.update(list =>
      list.map(s => s.id === subjectId ? { ...s, notes: s.notes.filter(n => n.id !== noteId) } : s),
    );
    const { error } = await this.supabase.client.from('subject_notes').delete().eq('id', noteId);
    if (error) this._subjects.set(prev);
  }

  async removeQA(id: string, index: number): Promise<void> {
    const sub = this.getById(id);
    if (!sub) return;
    const updatedQA = sub.qa.filter((_, i) => i !== index);
    const prev = this._subjects();
    this._subjects.update(list => list.map(s => s.id === id ? { ...s, qa: updatedQA } : s));
    const { error } = await this.supabase.client.from('study_subjects').update({ qa: updatedQA as never }).eq('id', id);
    if (error) this._subjects.set(prev);
  }

  getById(id: string): Subject | undefined {
    return this._subjects().find(s => s.id === id);
  }

  invalidate(): void {
    this._loaded.set(false);
  }
}
