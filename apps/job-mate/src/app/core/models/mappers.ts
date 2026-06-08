import type {
  SubjectRow, CompanyTagRow, StudyNoteRow,
  CodeSampleRow, ResourceRow, CompanyRow,
  ApplicationRow, UserSettingsRow,
} from './database.types';
import type {
  Subject, CompanyTag, StudyNote, CodeSample,
  Resource, Company, Application, UserSettings, ResumeData,
  SubjectCategory, SubjectPriority, SubjectStatus,
  AppStatus, CompanyStatus, CodeLanguage, ResourceType,
  CompanyFrequency, QA,
} from './jobmate.models';

// ─── Subject ──────────────────────────────────────────────────────────────────

export function fromSubjectRow(
  row: SubjectRow,
  related: {
    companyTags: CompanyTagRow[];
    notes: StudyNoteRow[];
    codeSamples: CodeSampleRow[];
    resources: ResourceRow[];
  } = { companyTags: [], notes: [], codeSamples: [], resources: [] },
): Subject {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    summary: row.summary,
    category: row.category as SubjectCategory,
    priority: row.priority as SubjectPriority,
    status: row.status as SubjectStatus,
    confidenceScore: row.confidence_score,
    estimatedReadTime: row.estimated_read_time,
    tags: row.tags ?? [],
    qa: (row.qa as unknown as QA[]) ?? [],
    sourceUrl: row.source_url,
    aiSummary: row.ai_summary,
    interviewedOn: (row.interviewed_on ?? []).map((d) => new Date(d)),
    lastReviewedAt: row.last_reviewed_at ? new Date(row.last_reviewed_at) : null,
    nextReviewAt: row.next_review_at ? new Date(row.next_review_at) : null,
    isArchived: row.is_archived,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    companyTags: related.companyTags.map(fromCompanyTagRow),
    notes: related.notes.map(fromStudyNoteRow),
    codeSamples: related.codeSamples.map(fromCodeSampleRow),
    resources: related.resources.map(fromResourceRow),
  };
}

export function toSubjectInsert(
  data: Pick<Subject, 'title' | 'summary' | 'category' | 'priority' | 'status' | 'confidenceScore' | 'estimatedReadTime' | 'tags' | 'sourceUrl'>,
  userId: string,
): Omit<SubjectRow, 'id' | 'created_at' | 'updated_at' | 'ai_summary' | 'interviewed_on' | 'last_reviewed_at' | 'next_review_at' | 'is_archived' | 'qa'> {
  return {
    user_id: userId,
    title: data.title,
    summary: data.summary ?? null,
    category: data.category,
    priority: data.priority,
    status: data.status,
    confidence_score: data.confidenceScore,
    estimated_read_time: data.estimatedReadTime ?? null,
    tags: data.tags,
    source_url: data.sourceUrl ?? null,
  };
}

// ─── CompanyTag ───────────────────────────────────────────────────────────────

export function fromCompanyTagRow(row: CompanyTagRow): CompanyTag {
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    frequency: row.frequency as CompanyFrequency,
    notes: row.notes,
  };
}

// ─── StudyNote ────────────────────────────────────────────────────────────────

export function fromStudyNoteRow(row: StudyNoteRow): StudyNote {
  return {
    id: row.id,
    subjectId: row.subject_id,
    content: row.content as unknown as string,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ─── CodeSample ───────────────────────────────────────────────────────────────

export function fromCodeSampleRow(row: CodeSampleRow): CodeSample {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    language: row.language as CodeLanguage,
    code: row.code,
    description: row.description,
    createdAt: new Date(row.created_at),
  };
}

// ─── Resource ─────────────────────────────────────────────────────────────────

export function fromResourceRow(row: ResourceRow): Resource {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    url: row.url,
    type: row.type as ResourceType,
    read: row.read,
  };
}

// ─── Company ──────────────────────────────────────────────────────────────────

export function fromCompanyRow(row: CompanyRow): Company {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    status: row.status as CompanyStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ─── Application ──────────────────────────────────────────────────────────────

export function fromApplicationRow(row: ApplicationRow): Application {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    company: row.company,
    date: row.date,
    location: row.location,
    status: row.status as AppStatus,
    salary: row.salary,
    url: row.url ?? null,
    tags: row.tags ?? [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ─── UserSettings ─────────────────────────────────────────────────────────────

export function fromSettingsRow(row: UserSettingsRow): UserSettings {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    accent: row.accent as UserSettings['accent'],
    resume: row.resume ? (row.resume as unknown as ResumeData) : null,
    updatedAt: new Date(row.updated_at),
  };
}
