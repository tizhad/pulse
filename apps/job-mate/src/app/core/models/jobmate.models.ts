export type SubjectStatus = 'in-progress' | 'done' | 'to-do';
export type SubjectPriority = 'critical' | 'medium' | 'low';

export type CompanyStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'no-reply';

export type AppStatus =
  | 'saved'
  | 'applied'
  | 'phone-screen'
  | 'interviewing'
  | 'offer'
  | 'rejected';

export interface Content {
  title?: string;
  description?: string;
  code?: string;
}

export interface QA {
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Subject {
  id: string;
  name: string;
  companies?: string[];
  status: SubjectStatus;
  priority: SubjectPriority;
  notes?: string;
  content?: Content[];
  qa?: QA[];
}

export interface Company {
  id: string;
  name: string;
  category: string;
  status: CompanyStatus;
  linkedSubjects: number;
  applications: number;
}

export interface Application {
  id: string;
  title: string;
  company: string;
  date: string;
  location: string;
  status: AppStatus;
  salary?: string;
  tags?: string[];
}

export interface UserSettings {
  displayName: string;
  email: string;
  accent: 'indigo' | 'coral' | 'mint';
}
