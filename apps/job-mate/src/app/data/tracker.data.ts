import {
  StudyWeek,
  Company,
  ResumeFix,
  CompanyStatus,
  FixUrgency,
  TaskTag,
} from '../core/models/tracker.models';

export const STUDY_WEEKS: StudyWeek[] = [
  {
    id: 'week-1',
    label: 'Week 1 — Angular Fundamentals',
    tasks: [
      { id: 'w1-t1', label: 'Zoneless change detection deep dive', tag: TaskTag.Study, done: false },
      { id: 'w1-t2', label: 'Signals: signal(), computed(), effect()', tag: TaskTag.Study, done: false },
      { id: 'w1-t3', label: 'Build a reactive counter with Signals', tag: TaskTag.Project, done: false },
      { id: 'w1-t4', label: 'Standalone components & lazy routes', tag: TaskTag.Study, done: false },
      { id: 'w1-t5', label: 'Build a mini SPA with @defer', tag: TaskTag.Project, done: false },
    ],
  },
  {
    id: 'week-2',
    label: 'Week 2 — State & Services',
    tasks: [
      { id: 'w2-t1', label: 'Signal-based services vs NgRx Signal Store', tag: TaskTag.Study, done: false },
      { id: 'w2-t2', label: 'Implement TrackerStateService', tag: TaskTag.Project, done: false },
      { id: 'w2-t3', label: 'localStorage sync with effect()', tag: TaskTag.Study, done: false },
      { id: 'w2-t4', label: 'Unit test services with Jest/Vitest', tag: TaskTag.Study, done: false },
      { id: 'w2-t5', label: 'Build ProgressService with computed()', tag: TaskTag.Project, done: false },
    ],
  },
  {
    id: 'week-3',
    label: 'Week 3 — Angular Patterns',
    tasks: [
      { id: 'w3-t1', label: 'input() and output() signal-based I/O', tag: TaskTag.Study, done: false },
      { id: 'w3-t2', label: 'Control flow: @if, @for, @switch', tag: TaskTag.Study, done: false },
      { id: 'w3-t3', label: '@defer on viewport & on interaction', tag: TaskTag.Study, done: false },
      { id: 'w3-t4', label: 'Angular Animations for tab transitions', tag: TaskTag.Project, done: false },
      { id: 'w3-t5', label: 'SSR patterns: RenderMode, hydration', tag: TaskTag.Study, done: false },
    ],
  },
  {
    id: 'week-4',
    label: 'Week 4 — Testing & Polish',
    tasks: [
      { id: 'w4-t1', label: 'Playwright E2E: task check flow', tag: TaskTag.Project, done: false },
      { id: 'w4-t2', label: 'Playwright E2E: company status flow', tag: TaskTag.Project, done: false },
      { id: 'w4-t3', label: 'Mobile responsive layout', tag: TaskTag.Project, done: false },
      { id: 'w4-t4', label: 'Dark mode with CSS custom properties', tag: TaskTag.Study, done: false },
      { id: 'w4-t5', label: 'Performance audit & bundle analysis', tag: TaskTag.Study, done: false },
    ],
  },
];

export const COMPANIES: Company[] = [
  // Tier 1 — Dream companies
  {
    id: 'c-1',
    name: 'Google',
    tier: 1,
    whyItFits: 'Angular is maintained here; deep frontend culture',
    status: CompanyStatus.NotApplied,
  },
  {
    id: 'c-2',
    name: 'Vercel',
    tier: 1,
    whyItFits: 'Remote-first, cutting-edge web platform, open source driven',
    status: CompanyStatus.NotApplied,
  },
  {
    id: 'c-3',
    name: 'Shopify',
    tier: 1,
    whyItFits: 'Large-scale frontend systems, strong eng culture',
    status: CompanyStatus.NotApplied,
  },

  // Tier 2 — Strong fits
  {
    id: 'c-4',
    name: 'Atlassian',
    tier: 2,
    whyItFits: 'Complex UIs (Jira, Confluence), mature product org',
    status: CompanyStatus.NotApplied,
  },
  {
    id: 'c-5',
    name: 'Stripe',
    tier: 2,
    whyItFits: 'Exceptional documentation standards, great DX focus',
    status: CompanyStatus.NotApplied,
  },
  {
    id: 'c-6',
    name: 'Notion',
    tier: 2,
    whyItFits: 'Real-time collaborative editor — hard frontend problems',
    status: CompanyStatus.NotApplied,
  },

  // Tier 3 — Good opportunities
  {
    id: 'c-7',
    name: 'Linear',
    tier: 3,
    whyItFits: 'Small team, high craft bar, Angular-adjacent stack',
    status: CompanyStatus.NotApplied,
  },
  {
    id: 'c-8',
    name: 'Supabase',
    tier: 3,
    whyItFits: 'Open source, growing fast, remote-first',
    status: CompanyStatus.NotApplied,
  },
  {
    id: 'c-9',
    name: 'Nx / Nrwl',
    tier: 3,
    whyItFits: 'Direct alignment with monorepo + Angular expertise',
    status: CompanyStatus.NotApplied,
  },
];

export const RESUME_FIXES: ResumeFix[] = [
  {
    id: 'f-1',
    label: 'Add quantified impact to every bullet point',
    urgency: FixUrgency.Critical,
    resolved: false,
  },
  {
    id: 'f-2',
    label: 'Move skills section above work experience',
    urgency: FixUrgency.Critical,
    resolved: false,
  },
  {
    id: 'f-3',
    label: 'Replace job duties with achievements',
    urgency: FixUrgency.Critical,
    resolved: false,
  },
  {
    id: 'f-4',
    label: 'Trim to one page for under-10-year experience',
    urgency: FixUrgency.Warning,
    resolved: false,
  },
  {
    id: 'f-5',
    label: 'Add GitHub and LinkedIn links to header',
    urgency: FixUrgency.Warning,
    resolved: false,
  },
  {
    id: 'f-6',
    label: 'Remove references to obsolete tech (AngularJS, jQuery)',
    urgency: FixUrgency.Warning,
    resolved: false,
  },
  {
    id: 'f-7',
    label: 'Fix inconsistent date formatting',
    urgency: FixUrgency.Warning,
    resolved: false,
  },
  {
    id: 'f-8',
    label: 'Spell-check entire document',
    urgency: FixUrgency.Warning,
    resolved: false,
  },
];
