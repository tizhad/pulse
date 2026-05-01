export enum TaskTag {
  Study = 'study',
  Project = 'project',
}

export enum CompanyStatus {
  NotApplied = 'not-applied',
  Applied = 'applied',
  Interview = 'interview',
  Offer = 'offer',
  Rejected = 'rejected',
}

export enum FixUrgency {
  Critical = 'critical',
  Warning = 'warning',
  Resolved = 'resolved',
}

export interface StudyTask {
  id: string;
  label: string;
  tag: TaskTag;
  done: boolean;
}

export interface StudyWeek {
  id: string;
  label: string;
  tasks: StudyTask[];
}

export interface Company {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  whyItFits: string;
  status: CompanyStatus;
}

export interface ResumeFix {
  id: string;
  label: string;
  urgency: FixUrgency;
  resolved: boolean;
}
