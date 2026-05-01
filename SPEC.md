# Job Search Tracker — Project Spec

## Tech stack

- Angular 21, fully Zoneless (no Zone.js)
- Signals for all state (`signal()`, `computed()`, `effect()`)
- Standalone components only
- `@defer` for non-critical UI sections
- Angular Animations for tab transitions and progress bars
- Jest for unit tests, Playwright for E2E

---

## Features

### 1. Dashboard tab

Summary stat cards (all reactive via Signals):

- Tasks completed / total tasks
- Companies applied
- Interviews scheduled

### 2. Study Plan tab

- 4 collapsible week sections
- Each week has tasks tagged as `study` or `project`
- Checkable tasks, per-week progress bar updates reactively

### 3. Companies tab

- 3 tiers of companies
- Each row: name, why-it-fits note, status button
- Status cycles: `not-applied → applied → interview → offer → rejected`
- Each status has a distinct colour

### 4. Resume Fixes tab

- Checklist with urgency levels: `critical / warning / resolved`
- Ticking an item marks it resolved with colour change

---

## Architecture

### Services

- `TrackerStateService` — all state as Signals, single source of truth
- `StorageService` — localStorage with versioned key `tracker_v1`, full error handling
- `ProgressService` — `computed()` deriving completion percentages, used by dashboard and progress bars

### Data

- All tasks, companies, fixes defined in `src/app/data/tracker.data.ts`
- Never hardcoded inside components

### Folder structure

```
src/
  app/
    core/
      services/
        tracker-state.service.ts
        storage.service.ts
        progress.service.ts
    data/
      tracker.data.ts
    features/
      dashboard/
      study-plan/
      companies/
      fixes/
    shared/
      components/
        progress-bar/
        status-badge/
        task-item/
```

---

## Angular 21 patterns — mandatory

- `@if` and `@for` control flow only (no `*ngIf`, no `*ngFor`)
- `@defer (on viewport)` for the companies list
- `@defer (on interaction)` for the resume fixes tab
- `input()` and `output()` signal-based I/O (no `@Input()` decorator)
- `effect()` to sync state to localStorage
- `OnPush` change detection on all components

---

## Tests

### Unit tests (Jest)

- `TrackerStateService`: task toggle, company status cycling, fix resolution
- `ProgressService`: computed percentage at 0%, 50%, 100%

### E2E (Playwright)

- User opens app
- Checks off a task → progress bar updates
- Marks a company as applied → stats update

---

## Styling

- CSS custom properties for all colours
- Light and dark mode support
- No external UI libraries — custom CSS only
- Smooth transitions on progress bars and status badges
- Mobile responsive

---

## README must include

- Why Zoneless was chosen over Zone.js
- How Signals replace NgRx for this use case
- Architecture decisions
- How to run Jest and Playwright tests

---

## Implementation notes — interview reference

### localStorage — where and why

**File:** `core/services/storage.service.ts`

localStorage is used to persist all tracker state across page refreshes without a backend. The key format is `tracker_v1:<entity>` (e.g. `tracker_v1:weeks`, `tracker_v1:companies`, `tracker_v1:fixes`). The `v1` prefix is intentional — if the data shape changes in the future, bumping the version key means old persisted data is ignored cleanly instead of crashing JSON.parse on a mismatched shape.

Every `load()` and `save()` is wrapped in try/catch for two real failure modes:
- **JSON.parse throws** — corrupted or hand-edited storage value
- **setItem throws QuotaExceededError** — private browsing mode on Safari caps storage at ~0 bytes; some browsers cap at 5 MB

The service itself has no knowledge of what it's storing — it's a generic key/value wrapper. The domain logic stays in `TrackerStateService`.

---

### Signals — what each primitive does and where it's used

Angular Signals are a reactive primitive introduced in Angular 16 and stabilised in Angular 17. In a zoneless app they are the **only** mechanism that triggers change detection — there is no Zone.js polling the component tree.

**`signal<T>(initialValue)`** — a writable reactive value. Reading it inside a template or `computed()` creates a dependency automatically. Used in `TrackerStateService` for `weeks`, `companies`, and `fixes` — these are the three root state atoms that everything else derives from.

```ts
// TrackerStateService
readonly weeks = signal<StudyWeek[]>(...);
```

Updating a signal uses `.set(newValue)` or `.update(fn)`. We always use `.update()` with a spread to produce a new array reference — this is required because Signals use reference equality to decide whether to notify dependents. Mutating in place (`array.push()`) would produce the same reference and silently skip updates.

**`computed(() => ...)`** — a read-only derived signal. It re-runs its function only when one of the signals it read last time has changed. Used entirely in `ProgressService` to derive stats from the state signals without duplicating logic or caching manually.

```ts
// ProgressService
readonly taskPercent = computed(() =>
  Math.round((this.doneTasks() / this.totalTasks()) * 100)
);
```

A computed is lazy — it does not run until something reads it, and then it caches the result until a dependency changes. This means the Dashboard can read `taskPercent()` on every render cycle and it only recomputes when `weeks` actually changes.

**`effect(() => ...)`** — runs a side-effect whenever its signal dependencies change. Used in `TrackerStateService` to sync each signal to localStorage automatically. The effect reads the signal (creating a dependency), then writes to storage.

```ts
// TrackerStateService constructor
effect(() => this.storage.save('weeks', this.weeks()));
```

This is the Angular-idiomatic replacement for `ngOnChanges`, `BehaviorSubject.subscribe()`, or an NgRx effect — for the specific case of "do X whenever Y changes."

**Why not put the localStorage sync directly in `toggleTask()` / `cycleStatus()` etc.?**
Because then every mutation method would need to remember to call `save()`. The `effect()` approach is declarative — the sync is defined once and happens automatically regardless of which method changes the signal.

---

### RxJS — yes or no?

**Short answer: Angular uses it internally. We do not use it ourselves.**

RxJS ships as a dependency of `@angular/core` and `@angular/router`. The Angular router emits `NavigationEnd` and other events as Observables internally. So RxJS is present in `node_modules`.

However, **our application code contains zero Observables, zero Subjects, zero pipes, and zero subscriptions.** Everything that would previously have been a `BehaviorSubject` is now a `signal()`. Everything that would have been a `pipe(map(...))` is now a `computed()`. Everything that would have been a `.subscribe(sideEffect)` is now an `effect()`.

| RxJS (old pattern) | Signals (this app) |
|---|---|
| `BehaviorSubject<T>` | `signal<T>()` |
| `Observable.pipe(map(...))` | `computed(() => ...)` |
| `.subscribe(() => sideEffect)` | `effect(() => sideEffect)` |
| `async` pipe in template | signal read `mySignal()` in template |
| `combineLatest([a$, b$])` | `computed(() => [a(), b()])` |

**When would you still reach for RxJS?**
- HTTP requests (`HttpClient` returns `Observable`) — but we have no HTTP in this app
- WebSocket streams, SSE, or any push-based source from the outside world
- Complex time-based operators (`debounceTime`, `switchMap`, `retry`) — Signals have no equivalent

For a local CRUD app with no server, Signals replace RxJS entirely and the result is simpler, more readable, and fully synchronous.

---

### `inject()` vs constructor injection — and why it matters here

Angular 14+ introduced `inject()` as a functional alternative to constructor parameter injection. In this service it was not a style choice — it was a **correctness requirement**.

```ts
@Injectable({ providedIn: 'root' })
export class TrackerStateService {
  private readonly storage = inject(StorageService); // ← field 1

  readonly weeks = signal<StudyWeek[]>(
    this.storage.load('weeks') ?? STUDY_WEEKS,       // ← field 2, reads field 1
  );
```

TypeScript initialises class fields **top-to-bottom**, before the constructor body runs. If `storage` were injected via the constructor parameter (`constructor(private storage: StorageService)`), it would not be assigned yet when `weeks` tries to call `this.storage.load()` — the field initialiser runs before Angular sets the constructor parameter. The result is `Cannot read properties of undefined` at runtime.

`inject()` as a field initialiser runs in field order, so `storage` is set before `weeks` tries to use it. This is now the Angular team's recommended pattern for services.

---

### OnPush — where and why

Every component in this app has `changeDetection: ChangeDetectionStrategy.OnPush`.

In a zoneless app, `Default` change detection would never run at all (there is no Zone.js to trigger the scheduler). `OnPush` makes Angular check a component only when:
1. A signal it reads in its template changes
2. An `input()` reference changes
3. An `AsyncPipe` emits
4. `ChangeDetectorRef.markForCheck()` is called explicitly

In practice, with Signals, you never need to call `markForCheck()` manually. The signal graph handles it. `OnPush` is set explicitly to make this contract visible and to catch any accidental mutable-state bugs at development time.

---

### Immutability — why `.update()` always returns a new array

Angular Signals use **reference equality** (`===`) to decide whether dependents need to be notified. If you mutate an array in place, the reference does not change, so computed values and templates that depend on the signal are never re-evaluated.

```ts
// ✗ Wrong — same array reference, nothing updates
this.weeks().find(w => w.id === weekId)!.tasks[0].done = true;

// ✓ Correct — new array references at every level, dependents re-evaluate
this.weeks.update(weeks =>
  weeks.map(week =>
    week.id !== weekId ? week : {
      ...week,
      tasks: week.tasks.map(task =>
        task.id !== taskId ? task : { ...task, done: !task.done }
      )
    }
  )
);
```

This pattern (map → spread → replace) is the same immutability discipline used in Redux/NgRx — Signals just enforce it implicitly through reference equality rather than through a reducer contract.

---

### Circular dependency — how it was resolved

`tracker.data.ts` needs the enums (`TaskTag`, `CompanyStatus`, `FixUrgency`) to type the seed data. `TrackerStateService` needs the seed data as fallback values. If the enums lived in the service, you'd have:

```
tracker.data.ts  →  imports from  →  tracker-state.service.ts
tracker-state.service.ts  →  imports from  →  tracker.data.ts
```

A circular import. At runtime the module that loads second sees `undefined` for the values from the module that loads first, because the other module's exports haven't been assigned yet. This produced the `Cannot read properties of undefined (reading 'Study')` error in tests.

**Fix:** extract all enums and interfaces into `core/models/tracker.models.ts`. Both the service and the data file import from there. Neither imports from the other. The dependency graph is now a DAG with no cycles.

```
tracker.models.ts  ←  tracker.data.ts
tracker.models.ts  ←  tracker-state.service.ts  ←  tracker.data.ts
```
