// ─── Enums ────────────────────────────────────────────────────────────────────

export type SubjectStatus = 'not_started' | 'in_progress' | 'needs_review' | 'confident' | 'mastered';
export type SubjectPriority = 'critical' | 'high' | 'medium' | 'low';
export type SubjectCategory =
  | 'angular' | 'react' | 'javascript' | 'typescript'
  | 'performance' | 'testing' | 'accessibility'
  | 'system_design' | 'css' | 'soft_skills';

export type CompanyStatus = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'no-reply';
export type AppStatus = 'saved' | 'applied' | 'phone-screen' | 'interviewing' | 'offer' | 'rejected';
export type CodeLanguage = 'typescript' | 'javascript' | 'html' | 'css' | 'python' | 'sql' | 'bash' | 'json';
export type ResourceType = 'article' | 'video' | 'docs' | 'github' | 'podcast';
export type CompanyFrequency = 'once' | 'often' | 'always';

// ─── Q&A (stored as jsonb on study_subjects) ──────────────────────────────────

export interface QA {
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// ─── Subject child entities ───────────────────────────────────────────────────

export interface CompanyTag {
  id: string;
  subjectId: string;
  name: string;
  frequency: CompanyFrequency;
  notes: string | null;
}

export interface StudyNote {
  id: string;
  subjectId: string;
  content: string; // HTML string from Tiptap
  createdAt: Date;
  updatedAt: Date;
}

export interface CodeSample {
  id: string;
  subjectId: string;
  title: string;
  language: CodeLanguage;
  code: string;
  description: string | null;
  createdAt: Date;
}

export interface Resource {
  id: string;
  subjectId: string;
  title: string;
  url: string;
  type: ResourceType;
  read: boolean;
}

// ─── Study subject ────────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  userId: string;
  title: string;
  summary: string | null;
  category: SubjectCategory;
  priority: SubjectPriority;
  status: SubjectStatus;
  confidenceScore: number;
  estimatedReadTime: number | null;
  tags: string[];
  qa: QA[];
  sourceUrl: string | null;
  aiSummary: string | null;
  interviewedOn: Date[];
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  // joined relations
  companyTags: CompanyTag[];
  notes: StudyNote[];
  codeSamples: CodeSample[];
  resources: Resource[];
}

export interface StudyFilters {
  category: SubjectCategory | null;
  status: SubjectStatus | null;
  priority: SubjectPriority | null;
  company: string | null;
  search: string;
}

// ─── Company ──────────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  userId: string;
  name: string;
  category: string;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Application ──────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  userId: string;
  title: string;
  company: string;
  date: string;
  location: string | null;
  status: AppStatus;
  salary: string | null;
  url: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Resume ───────────────────────────────────────────────────────────────────

export interface ResumeExperience {
  readonly title: string;
  readonly company: string;
  readonly dates: string;
  readonly bullets: string[];
}

export interface ResumeEducation {
  readonly degree: string;
  readonly institution: string;
  readonly year: string | null;
}

export interface ResumeData {
  readonly summary: string | null;
  readonly skills: string[];
  readonly experience: ResumeExperience[];
  readonly education: ResumeEducation[];
  readonly certifications: string[];
  readonly rawText: string;
}

// ─── User settings ────────────────────────────────────────────────────────────

export interface UserSettings {
  id: string;
  userId: string;
  displayName: string | null;
  accent: 'indigo' | 'coral' | 'mint';
  resume: ResumeData | null;
  updatedAt: Date;
}
