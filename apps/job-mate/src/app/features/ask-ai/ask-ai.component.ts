import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type PageState = 'idle' | 'loading' | 'ready';

type AiResult = {
  query: string;
  summary: string;
  potential: number;
  difficulty: Difficulty;
  tags: string[];
  askedBy: string[];
  outline: { title: string; bullets: string[] }[];
  questions: { q: string; a: string }[];
  snippet: { lang: string; code: string };
};

const MOCK_RESULT: AiResult = {
  query: 'Angular Router',
  summary:
    'The Angular Router enables navigation between views in a single-page app by mapping URL segments to components. It supports lazy loading, route guards, nested/child routes, route parameters, and resolvers for pre-fetching data.',
  potential: 8,
  difficulty: 'Medium',
  tags: ['Angular', 'Frontend', 'Routing', 'SPA'],
  askedBy: ['Google', 'Microsoft', 'Stripe'],
  outline: [
    {
      title: 'Core concepts',
      bullets: [
        'RouterModule.forRoot() vs forChild()',
        '<router-outlet> and routerLink directives',
        'Route configuration shape (path, component, children)',
      ],
    },
    {
      title: 'Advanced features',
      bullets: [
        'Lazy loading with loadChildren',
        'Route guards: CanActivate, CanDeactivate, Resolve',
        'Route parameters & ActivatedRoute observables',
      ],
    },
    {
      title: 'Common pitfalls',
      bullets: [
        'Subscribing to params vs snapshot',
        'Memory leaks from unsubscribed observables',
        'Misusing wildcard ** routes',
      ],
    },
  ],
  questions: [
    {
      q: 'What is the difference between RouterModule.forRoot() and forChild()?',
      a: 'forRoot() registers the router service and routes for the root module — call it once. forChild() only registers routes for feature modules without re-creating the router service.',
    },
    {
      q: 'How do route guards work in Angular?',
      a: 'Guards are services implementing interfaces like CanActivate or CanDeactivate. The router calls them before activating a route; returning false (or a UrlTree) cancels or redirects navigation.',
    },
    {
      q: 'How do you implement lazy loading?',
      a: "Use loadChildren with a dynamic import: { path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) }.",
    },
  ],
  snippet: {
    lang: 'ts',
    code: `const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./admin/admin.module').then(m => m.AdminModule),
  },
  { path: '**', component: NotFoundComponent },
];`,
  },
};

const SUGGESTIONS = [
  'React reconciliation',
  'PostgreSQL indexes',
  'Kubernetes pods vs deployments',
  'TCP three-way handshake',
  'OAuth 2 vs OIDC',
  'Big-O of quicksort',
];

const PARENTS = [
  { id: 'none', label: 'Top level' },
  { id: 'ds', label: 'Data Structures' },
  { id: 'sd', label: 'System Design' },
  { id: 'fe', label: 'Frontend' },
] as const;

const PARENT_LABELS: Record<string, string> = {
  none: 'Top level',
  ds: 'Data Structures',
  sd: 'System Design',
  fe: 'Frontend',
};

@Component({
  selector: 'app-ask-ai',
  templateUrl: './ask-ai.component.html',
  styleUrl: './ask-ai.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskAiComponent {
  readonly suggestions = SUGGESTIONS;
  readonly parents = PARENTS;

  readonly query = signal('');
  readonly pageState = signal<PageState>('idle');
  readonly result = signal<AiResult | null>(null);
  readonly added = signal(false);

  readonly selectedParent = signal('none');
  readonly priority = signal('high');
  readonly status = signal('todo');
  readonly includeSubjects = signal(true);
  readonly includeQA = signal(true);
  readonly includeCompanies = signal(true);
  readonly includeCode = signal(true);

  readonly addedParentLabel = computed(() => PARENT_LABELS[this.selectedParent()] ?? 'Top level');

  ask(q: string): void {
    if (!q.trim()) return;
    this.query.set(q);
    this.pageState.set('loading');
    this.added.set(false);
    setTimeout(() => {
      this.result.set({ ...MOCK_RESULT, query: q });
      this.pageState.set('ready');
    }, 1200);
  }

  onSubmit(): void {
    this.ask(this.query());
  }

  onAdd(): void {
    this.added.set(true);
  }

  onRegenerate(): void {
    const r = this.result();
    if (r) this.ask(r.query);
  }

  getSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
