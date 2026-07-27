import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import type { Subject, Company, Application } from '../models/jobmate.models';

export const GUEST_ITEM_LIMIT = 3;

function reviveDated<T extends { createdAt: Date; updatedAt: Date }>(item: T): T {
  return { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) };
}

function reviveSubject(subject: Subject): Subject {
  return {
    ...subject,
    createdAt: new Date(subject.createdAt),
    updatedAt: new Date(subject.updatedAt),
    lastReviewedAt: subject.lastReviewedAt ? new Date(subject.lastReviewedAt) : null,
    nextReviewAt: subject.nextReviewAt ? new Date(subject.nextReviewAt) : null,
    interviewedOn: (subject.interviewedOn ?? []).map(d => new Date(d)),
  };
}

/**
 * Two sample subjects shown to every first-time guest so the Subjects page
 * isn't empty. They're free — every guest still gets the full
 * GUEST_ITEM_LIMIT subjects to add themselves on top of these samples.
 * Content is intentionally complete (notes, Q&A, code samples, resources)
 * so a new guest sees what a fully studied subject looks like, not just a title.
 */
function buildSampleSubjects(): Subject[] {
  const now = new Date();
  const base = {
    userId: 'guest',
    priority: 'high' as const,
    status: 'not_started' as const,
    confidenceScore: 1,
    sourceUrl: null,
    aiSummary: null,
    interviewedOn: [] as Date[],
    lastReviewedAt: null,
    nextReviewAt: null,
    isArchived: false,
    isPinned: false,
    createdAt: now,
    updatedAt: now,
    companyTags: [],
  };

  const rxjsId = crypto.randomUUID();
  const signalsId = crypto.randomUUID();

  return [
    {
      ...base,
      id: rxjsId,
      title: 'RxJS',
      summary: 'Reactive extensions for JavaScript — observables, operators, and async data streams.',
      category: 'angular' as const,
      estimatedReadTime: 12,
      tags: ['observables', 'operators', 'async', 'rxjs-interop'],
      qa: [
        {
          question: 'What is the difference between a Subject and a BehaviorSubject?',
          answer:
            'A plain Subject has no memory — subscribers only receive values emitted after they subscribe. A BehaviorSubject always holds a current value: it requires an initial value at creation, and every new subscriber immediately receives the most recent value (or the initial one) before getting any future emissions. BehaviorSubjects are a common way to model observable "state" because late subscribers never miss the current snapshot.',
          difficulty: 'easy',
        },
        {
          question: 'When would you use switchMap vs mergeMap vs concatMap vs exhaustMap?',
          answer:
            'All four flatten a higher-order observable, but differ in how they handle overlapping inner observables. switchMap cancels the previous inner observable when a new source value arrives — ideal for typeahead search where only the latest request matters. mergeMap runs all inner observables concurrently and merges their emissions — use it when requests are independent and order doesn\'t matter. concatMap queues inner observables and runs them strictly one after another — use it when order must be preserved (e.g. sequential writes). exhaustMap ignores new source values while an inner observable is still active — useful for things like a submit button where you want to ignore repeat clicks until the first request finishes.',
          difficulty: 'medium',
        },
        {
          question: 'How do you prevent memory leaks with RxJS subscriptions in Angular?',
          answer:
            'Prefer the async pipe in templates so Angular manages subscribe/unsubscribe automatically. For subscriptions in component code, use takeUntilDestroyed() (from @angular/core/rxjs-interop) inside an injection context, which ties the subscription lifetime to the component/service being destroyed. Avoid manually tracking a Subscription and calling .unsubscribe() in ngOnDestroy unless you\'re outside an injection context — it works, but it\'s easy to forget one subscription in a component with several.',
          difficulty: 'medium',
        },
        {
          question: "What's the difference between hot and cold observables?",
          answer:
            'A cold observable creates a new, independent producer for every subscriber and starts emitting from the beginning each time (e.g. HttpClient requests) — nothing happens until you subscribe. A hot observable shares a single producer across all subscribers, who only see values emitted after they subscribed (e.g. a Subject wrapping DOM events or a WebSocket). Multicasting operators like share() or shareReplay() convert a cold observable into a hot one so multiple subscribers don\'t each trigger their own side effect.',
          difficulty: 'medium',
        },
        {
          question: 'How does toSignal() interact with RxJS observables in Angular 21?',
          answer:
            "toSignal() bridges an observable into a signal by subscribing once and writing each emission into a signal, so it can be read synchronously in templates and computed()s without an async pipe. It requires either an initialValue (or undefinedInitialValue) since the signal needs a value before the first emission. It automatically unsubscribes when the injection context (component/service) is destroyed. It's the recommended way to consume observables in signal-based components — reserve raw .subscribe() for imperative side effects that don't map to a piece of state.",
          difficulty: 'hard',
        },
        {
          question: 'Explain the difference between debounceTime and throttleTime.',
          answer:
            "debounceTime(n) waits for a pause of n ms with no new emissions before emitting the latest value — good for search inputs where you want to wait until the user stops typing. throttleTime(n) emits a value immediately, then ignores subsequent values for n ms — good for rate-limiting frequent events like scroll or mousemove where you still want periodic updates during continuous activity.",
          difficulty: 'easy',
        },
      ],
      notes: [
        {
          id: crypto.randomUUID(),
          subjectId: rxjsId,
          content: `
            <h2>What is RxJS?</h2>
            <p>RxJS (Reactive Extensions for JavaScript) is a library for composing asynchronous and event-based programs using <strong>observable sequences</strong>. Instead of manually wiring callbacks or promises together, you describe a pipeline of transformations and let the library push values through it over time.</p>

            <h2>Core building blocks</h2>
            <ul>
              <li><strong>Observable</strong> — a lazy push-based stream of values; nothing runs until something subscribes.</li>
              <li><strong>Observer</strong> — an object with <code>next</code>, <code>error</code>, and <code>complete</code> callbacks that consumes emissions.</li>
              <li><strong>Subscription</strong> — the handle returned by <code>subscribe()</code>; call <code>.unsubscribe()</code> to stop receiving values and release resources.</li>
              <li><strong>Subject</strong> — both an Observable and an Observer; useful for multicasting or acting as an event bus.</li>
              <li><strong>Operators</strong> — pure functions like <code>map</code>, <code>filter</code>, and <code>switchMap</code> that take an observable and return a new one, composed with <code>.pipe()</code>.</li>
            </ul>

            <h2>Hot vs cold</h2>
            <p>Cold observables (e.g. an HTTP call) run a fresh producer per subscriber. Hot observables (e.g. a Subject wrapping a click stream) share one producer across all subscribers. Getting this distinction wrong is a classic source of duplicated side effects — like firing the same HTTP request twice because two parts of the UI subscribed independently.</p>

            <h2>Common pitfalls</h2>
            <ul>
              <li>Nesting <code>.subscribe()</code> calls instead of flattening with <code>switchMap</code>/<code>mergeMap</code> — leads to "callback pyramid" and missed cancellation.</li>
              <li>Forgetting to unsubscribe from long-lived observables outside the async pipe, causing memory leaks and stale UI updates after a component is destroyed.</li>
              <li>Using <code>mergeMap</code> for a request that should cancel previous in-flight calls (should be <code>switchMap</code>) — causes race conditions where an older response overwrites a newer one.</li>
            </ul>

            <h2>RxJS in Angular 21</h2>
            <p>With signals as the default reactivity model, RxJS is now mostly reserved for genuinely asynchronous, event-based, or time-based logic (HTTP, WebSockets, debounced input, complex event composition). Use <code>toSignal()</code> to bridge an observable into signal-based components, and prefer <code>takeUntilDestroyed()</code> over manual subscription management.</p>
          `.trim(),
          createdAt: now,
          updatedAt: now,
        },
      ],
      codeSamples: [
        {
          id: crypto.randomUUID(),
          subjectId: rxjsId,
          title: 'switchMap for search-as-you-type',
          language: 'typescript' as const,
          code: `searchTerm$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.api.search(term)),
).subscribe(results => this.results.set(results));`,
          description: 'switchMap cancels the previous in-flight search whenever a new term arrives, avoiding stale results overwriting newer ones.',
          createdAt: now,
        },
        {
          id: crypto.randomUUID(),
          subjectId: rxjsId,
          title: 'Auto-unsubscribe with takeUntilDestroyed',
          language: 'typescript' as const,
          code: `export class PresenceService {
  private readonly ws = inject(WebSocketService);

  constructor() {
    this.ws.messages$
      .pipe(takeUntilDestroyed())
      .subscribe(msg => this.handleMessage(msg));
  }
}`,
          description: 'takeUntilDestroyed() must be called within an injection context; it ties the subscription lifetime to the enclosing component or service.',
          createdAt: now,
        },
      ],
      resources: [
        {
          id: crypto.randomUUID(),
          subjectId: rxjsId,
          title: 'RxJS official documentation',
          url: 'https://rxjs.dev',
          type: 'docs' as const,
          read: false,
        },
        {
          id: crypto.randomUUID(),
          subjectId: rxjsId,
          title: 'Angular RxJS interop guide',
          url: 'https://angular.dev/ecosystem/rxjs-interop',
          type: 'docs' as const,
          read: false,
        },
        {
          id: crypto.randomUUID(),
          subjectId: rxjsId,
          title: 'Learn RxJS — operator reference with examples',
          url: 'https://www.learnrxjs.io',
          type: 'article' as const,
          read: false,
        },
      ],
    },
    {
      ...base,
      id: signalsId,
      title: 'Signals',
      summary: "Angular's fine-grained reactive primitive for local and shared state.",
      category: 'angular' as const,
      estimatedReadTime: 9,
      tags: ['signals', 'reactivity', 'zoneless', 'change-detection'],
      qa: [
        {
          question: 'What problem do Signals solve that Zone.js-based change detection did not?',
          answer:
            "Zone.js triggers a change detection pass on the entire component tree for almost any async event (click, timer, HTTP response), relying on the framework to re-check bindings it can't statically know have changed. Signals track dependencies explicitly: reading a signal inside a template or computed() registers a fine-grained dependency, so an update to that signal notifies exactly the consumers that read it. This enables zoneless change detection — no Zone.js patching, more predictable updates, and smaller bundles.",
          difficulty: 'easy',
        },
        {
          question: 'What is the difference between signal(), computed(), and effect()?',
          answer:
            'signal() creates a writable, observable value you update with .set() or .update(). computed() derives a read-only value from other signals and re-evaluates lazily only when a dependency changes and it is read again — it must be pure. effect() runs a side effect whenever its signal dependencies change; it does not return a value and should never be used to derive state — that is what computed() is for.',
          difficulty: 'easy',
        },
        {
          question: 'Why shouldn\'t you use effect() to derive state?',
          answer:
            "effect() is for side effects (logging, syncing to localStorage, imperative DOM work), not for producing values other parts of the app depend on. Using it to derive state means writing into another signal from inside the effect, which creates an extra, unnecessary change-detection cycle, makes the data flow harder to trace, and can trigger 'signal written after read' errors or infinite loops if not guarded carefully. computed() expresses the same intent declaratively, runs lazily, and can't cause these problems because it's forbidden from having side effects.",
          difficulty: 'medium',
        },
        {
          question: 'How do signals interact with zoneless change detection?',
          answer:
            "In a zoneless app, Angular no longer relies on Zone.js to know when to check the view. Instead, components using OnPush + signals mark themselves for a check when a signal they read is updated — the framework schedules a change detection pass through the signal's own notification mechanism. This is why Angular 21 requires OnPush and signal-based state for zoneless apps: without signals (or manual markForCheck-style hooks, which are discouraged) there'd be no trigger to know something changed.",
          difficulty: 'medium',
        },
        {
          question: 'When would you still reach for RxJS instead of a signal?',
          answer:
            'Signals model synchronous, current-value state well, but they don\'t have native operators for time-based composition — debouncing, throttling, retries, cancellation, or combining multiple async event streams. For those cases, use RxJS to build the pipeline and bridge the result into a signal with toSignal() at the boundary of your component, keeping the component itself signal-based.',
          difficulty: 'medium',
        },
        {
          question: 'What is signal equality checking and how can you customize it?',
          answer:
            "By default, a signal only notifies consumers when its new value fails a default equal() check, which is Object.is-based reference equality — so setting an object/array signal to a new reference with the same shallow contents still triggers updates, while calling .set() with the exact same primitive value does not. You can pass a custom equality function via the equal option (e.g. signal(value, { equal: (a, b) => deepEqual(a, b) })) when you want structural comparison instead of reference comparison, which can prevent redundant downstream recomputation for object-shaped state.",
          difficulty: 'hard',
        },
      ],
      notes: [
        {
          id: crypto.randomUUID(),
          subjectId: signalsId,
          content: `
            <h2>What are Signals?</h2>
            <p>Signals are Angular's primitive for fine-grained reactivity: a wrapper around a value that notifies interested consumers whenever that value changes. Reading a signal (calling it as a function, e.g. <code>count()</code>) inside a reactive context — a template, a <code>computed()</code>, or an <code>effect()</code> — automatically registers a dependency.</p>

            <h2>The three primitives</h2>
            <ul>
              <li><code>signal(initialValue)</code> — writable state, updated with <code>.set(value)</code> or <code>.update(fn)</code>.</li>
              <li><code>computed(() =&gt; …)</code> — read-only derived state, recalculated lazily when a dependency changes and it's read again. Must stay pure.</li>
              <li><code>effect(() =&gt; { … })</code> — runs a side effect when dependencies change. Never used to derive state.</li>
            </ul>

            <h2>Signal-based component APIs</h2>
            <p><code>input()</code>, <code>output()</code>, and <code>model()</code> replace <code>@Input()</code>/<code>@Output()</code> decorators. <code>input()</code> is read-only inside the component; <code>model()</code> gives two-way binding support without needing separate input/output pairs. <code>viewChild()</code>/<code>viewChildren()</code> similarly replace the decorator-based query APIs and return signals instead of requiring lifecycle-hook timing tricks.</p>

            <h2>Zoneless change detection</h2>
            <p>Without Zone.js, Angular has no generic mechanism to know "something might have changed" after an async callback. Signals close that gap: updating a signal that a component's template (or an OnPush-checked ancestor) reads schedules exactly the change detection needed — no more, no less. This is why OnPush + signals is mandatory for zoneless apps, not just a style preference.</p>

            <h2>Common pitfalls</h2>
            <ul>
              <li>Using <code>effect()</code> to write into another signal to "derive" a value — use <code>computed()</code> instead.</li>
              <li>Mutating an object/array signal's value in place (e.g. <code>arr().push(x)</code>) instead of calling <code>.set()</code>/<code>.update()</code> with a new reference — mutation bypasses change notification entirely.</li>
              <li>Overusing bare RxJS <code>.subscribe()</code> when the value could just be a signal read directly in the template via <code>toSignal()</code>.</li>
            </ul>
          `.trim(),
          createdAt: now,
          updatedAt: now,
        },
      ],
      codeSamples: [
        {
          id: crypto.randomUUID(),
          subjectId: signalsId,
          title: 'Counter with signal() and computed()',
          language: 'typescript' as const,
          code: `count = signal(0);
doubled = computed(() => this.count() * 2);

increment(): void {
  this.count.update(n => n + 1);
}`,
          description: 'computed() recalculates lazily — it only re-runs the next time doubled() is read after count changes.',
          createdAt: now,
        },
        {
          id: crypto.randomUUID(),
          subjectId: signalsId,
          title: 'Bridging an observable into a signal',
          language: 'typescript' as const,
          code: `private readonly http = inject(HttpClient);

user = toSignal(this.http.get<User>('/api/me'), { initialValue: null });`,
          description: 'toSignal() subscribes once and unsubscribes automatically on destroy — no async pipe or manual subscription needed.',
          createdAt: now,
        },
        {
          id: crypto.randomUUID(),
          subjectId: signalsId,
          title: 'effect() for a side effect, not derived state',
          language: 'typescript' as const,
          code: `theme = signal<'light' | 'dark'>('light');

constructor() {
  effect(() => {
    localStorage.setItem('theme', this.theme());
  });
}`,
          description: 'Correct use of effect(): syncing to an external system (localStorage), not computing a value the app depends on.',
          createdAt: now,
        },
      ],
      resources: [
        {
          id: crypto.randomUUID(),
          subjectId: signalsId,
          title: 'Angular Signals guide',
          url: 'https://angular.dev/guide/signals',
          type: 'docs' as const,
          read: false,
        },
        {
          id: crypto.randomUUID(),
          subjectId: signalsId,
          title: 'RxJS interop with signals',
          url: 'https://angular.dev/ecosystem/rxjs-interop',
          type: 'docs' as const,
          read: false,
        },
      ],
    },
  ];
}

/**
 * Lets signed-out visitors create up to GUEST_ITEM_LIMIT of each entity so
 * they can try the product before signing up. Items live in localStorage
 * only; the owning store migrates them to Supabase on sign-up.
 */
@Injectable({ providedIn: 'root' })
export class GuestContentService {
  private readonly storage = inject(StorageService);

  private readonly _subjects = signal<Subject[]>(this.loadOrSeedSubjects());
  private readonly _subjectsAddedCount = signal<number>(
    this.storage.load<number>('guest_subjects_added_count') ?? 0,
  );
  private readonly _companies = signal<Company[]>(
    (this.storage.load<Company[]>('guest_companies') ?? []).map(reviveDated),
  );
  private readonly _applications = signal<Application[]>(
    (this.storage.load<Application[]>('guest_applications') ?? []).map(reviveDated),
  );

  readonly subjects = this._subjects.asReadonly();
  readonly companies = this._companies.asReadonly();
  readonly applications = this._applications.asReadonly();

  /** Subjects the guest created themselves — excludes the 2 free sample subjects. */
  readonly subjectsAddedCount = this._subjectsAddedCount.asReadonly();

  private loadOrSeedSubjects(): Subject[] {
    const stored = this.storage.load<Subject[]>('guest_subjects');
    if (stored) return stored.map(reviveSubject);

    const seed = buildSampleSubjects();
    this.storage.save('guest_subjects', seed);
    return seed;
  }

  canAddSubject(): boolean {
    return this._subjectsAddedCount() < GUEST_ITEM_LIMIT;
  }

  canAddCompany(): boolean {
    return this._companies().length < GUEST_ITEM_LIMIT;
  }

  canAddApplication(): boolean {
    return this._applications().length < GUEST_ITEM_LIMIT;
  }

  addSubject(subject: Subject): void {
    this._subjects.update(list => [subject, ...list]);
    this.storage.save('guest_subjects', this._subjects());
    this._subjectsAddedCount.update(n => n + 1);
    this.storage.save('guest_subjects_added_count', this._subjectsAddedCount());
  }

  updateSubject(id: string, patch: Partial<Pick<Subject,
    'title' | 'summary' | 'category' | 'priority' | 'status' |
    'confidenceScore' | 'estimatedReadTime' | 'tags' | 'sourceUrl' | 'isArchived' | 'isPinned'
  >>): void {
    this._subjects.update(list =>
      list.map(s => s.id === id ? { ...s, ...patch } : s),
    );
    this.storage.save('guest_subjects', this._subjects());
  }

  addCompany(company: Company): void {
    this._companies.update(list => [company, ...list]);
    this.storage.save('guest_companies', this._companies());
  }

  addApplication(application: Application): void {
    this._applications.update(list => [application, ...list]);
    this.storage.save('guest_applications', this._applications());
  }

  clearSubjects(): void {
    this._subjects.set([]);
    this._subjectsAddedCount.set(0);
    this.storage.clear('guest_subjects');
    this.storage.clear('guest_subjects_added_count');
  }

  clearCompanies(): void {
    this._companies.set([]);
    this.storage.clear('guest_companies');
  }

  clearApplications(): void {
    this._applications.set([]);
    this.storage.clear('guest_applications');
  }
}
