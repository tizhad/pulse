# CLAUDE.md — Angular 21 Monorepo Rules

> This file is loaded at the start of every session. Follow every rule here unless explicitly told otherwise in the conversation.

---

## 🗂️ Monorepo Structure

This workspace contains **two Angular 21 applications** in a monorepo:

```
/
├── projects/
│   ├── job-mate/
│   └── wealth-mate/
├── libs/
│   └── shared/           # Shared components, services, models, utils
├── decision.md           # Architecture decisions log
├── workflow.md           # Feature workflow tracking
├── e2e/                  # Playwright end-to-end tests
├── angular.json
├── tsconfig.base.json
└── package.json
```

**Key rule:** Never put app-specific logic in `libs/shared`. Only put there what is genuinely reused by both apps.

---

## ⚙️ Angular 21 Modernization Rules

### Change Detection

- **Always use zoneless change detection** (default in Angular 21). Never add `provideZoneChangeDetection()` unless there is a documented reason in `decision.md`.
- All components **must** use `changeDetection: ChangeDetectionStrategy.OnPush`.
- Never use `markForCheck()` or `detectChanges()` — prefer signals and computed values instead.

### Components

- All components **must be standalone**. Never use NgModules for new code.
- Use `input()`, `output()`, and `model()` signal-based APIs. Never use `@Input()` / `@Output()` decorators for new code.
- Prefer `inject()` over constructor injection.
- Use `viewChild()` / `viewChildren()` signal queries instead of `@ViewChild` / `@ViewChildren`.

### Signals & State

- Use `signal()`, `computed()`, and `effect()` for all local component state.
- Use `effect()` only for side effects. Never use it to derive state — use `computed()` instead.
- For shared/global state, use **NgRx SignalStore** (`@ngrx/signals`). Do not create ad-hoc singleton services with raw signals for cross-component state.
- Prefer `toSignal()` when bridging RxJS observables into signal-based components. Minimize bare `.subscribe()` calls.

### Forms — CRITICAL

**Never use `ngModel` or template-driven forms.** This is outdated and must not appear in new code.

For **new forms**, use **Signal Forms** (Angular 21 experimental API):

```typescript
import { form, Field } from '@angular/forms/signals';
import { required, email } from '@angular/forms/signals';

interface LoginData {
  email: string;
  password: string;
}

loginModel = signal<LoginData>({ email: '', password: '' });
loginForm = form(this.loginModel, (path) => {
  required(path.email);
  email(path.email);
});
```

For **existing forms** already using Reactive Forms, keep them as-is unless refactoring is in scope. Use `compatForm()` when mixing both systems.

**Do not use `FormGroup` / `FormControl` / `FormBuilder` for any new form.** If a task involves a form and it is unclear which approach fits, ask before writing code.

### Routing

- Use **functional guards** (`canActivate: [() => inject(AuthService).isLoggedIn()]`). Never use class-based guards.
- Use `loadComponent` for lazy-loaded routes. Never lazy-load entire modules.
- Pass data via `resolve` with functional resolvers using `inject()`.

### HTTP

- Use `HttpClient` with `inject()` inside services.
- Prefer `toSignal(this.http.get(...))` for read-only data in components.
- Always type HTTP responses explicitly — never use `any`.

---

## 🔷 TypeScript Rules

- **Strict mode is non-negotiable.** `tsconfig.base.json` must keep `strict: true`. Never disable strictness with `@ts-ignore` or `as any` without a comment explaining why.
- Use `readonly` on all properties that should not be mutated.
- Prefer `type` over `interface` for union types and data shapes. Use `interface` for class contracts.
- Use explicit return types on all public methods and service functions.
- Avoid `enum` — use `const` objects with `as const` and derive the type: `type Status = typeof STATUS[keyof typeof STATUS]`.
- Use `satisfies` operator when typing object literals to get both type-safety and inference.
- Never use `Function`, `Object`, or `{}` as types.

---

## 💬 Commit Messages

Every commit message must follow this format:

```
<type>(<scope>): <short description>

[optional body explaining WHY, not WHAT]
```

Types: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `perf`  
Scope: the affected project or lib, e.g. `job-mate`, `wealth-mate`, `shared`, `e2e`

Examples:

- `feat(job-mate): add user profile signal form with validation`
- `fix(shared): correct date pipe locale for DE region`
- `test(e2e): add Playwright flow for checkout form submission`

**Never write vague messages** like `fix stuff`, `update`, `WIP`, or `changes`.

---

## 📋 Feature Workflow Protocol

When working on a feature:

1. **Do not update `decision.md` or `workflow.md` mid-feature.** Only update them when the feature is fully complete and verified.
2. When a feature is complete, append to **`workflow.md`**:
   ```
   ## [Feature Name] — completed [date]
   - What was built
   - Which projects/libs were affected
   - Playwright test file added: yes/no
   ```
3. If an architectural decision was made (e.g. Signal Forms vs Reactive Forms, localStorage vs IndexedDB), append to **`decision.md`**:
   ```
   ## [Decision Title] — [date]
   **Context:** Why this came up
   **Decision:** What was chosen
   **Alternatives considered:** What else was evaluated
   **Consequences:** Trade-offs accepted
   ```

---

## 🎭 Playwright End-to-End Testing

A Playwright script must be run after every meaningful UI change.

- E2E tests live in `/e2e/`.
- Test file naming: `[feature-name].spec.ts`
- After completing a feature or UI change, run:
  ```bash
  npx playwright test
  ```
- If a test fails, **do not move on**. Fix the failure or flag it explicitly.
- When adding a new user-facing feature, add a corresponding Playwright test that covers the happy path at minimum.
- Use `page.getByRole()` and `page.getByLabel()` selectors. Avoid `page.locator('css selector')` unless unavoidable.

---

## 🖥️ UI Quality Checks

After every visual change, perform a UI check:

1. **Responsiveness** — Does it render correctly at 375px (mobile), 768px (tablet), 1280px (desktop)?
2. **Accessibility** — Are interactive elements reachable by keyboard? Do form fields have labels? Are ARIA attributes correct? Use Angular 21's `@angular/aria` directives where applicable.
3. **States** — Are loading, empty, and error states handled and visible?
4. **Consistency** — Does it match the existing design system/component style in the shared lib?

If a UI check reveals issues, fix them before marking the feature done.

---

## 💾 Storage & Persistence — Ask First

**Before writing any code that uses:**

- `localStorage` / `sessionStorage`
- `IndexedDB`
- A backend API / database
- Cookies
- In-memory state vs. persistent state

…**stop and propose options to the user** with trade-offs before implementing. Example format:

> "For persisting user preferences I see two options:
>
> 1. `localStorage` — simple, synchronous, 5MB limit, not available in SSR
> 2. Backend API — survives device changes, requires auth, adds latency
>    Which fits better for your use case?"

This prevents refactoring entire data layers later.

---

## 🧪 Unit Testing

- Use **Vitest** (default in Angular 21). Never use Karma or Jest for new tests.
- Test files: `*.spec.ts` co-located with source files.
- Test signal-based components by reading signal values directly, not by spying on lifecycle hooks.
- Mock HTTP with `HttpTestingController`. Never make real HTTP calls in unit tests.

---

## 🏗️ Monorepo-Specific Rules

- **Shared lib imports only** — apps import from `@workspace/shared`, never with relative paths crossing project boundaries (e.g., `../../wealth-mate/...` is forbidden).
- **Path aliases** are defined in `tsconfig.base.json`. Never hardcode relative cross-project paths.
- When generating a component, service, or pipe that will be used by both apps, generate it in `libs/shared`, not in either app.
- When only one app needs something, keep it inside that app's folder.
- **Build both apps before declaring a feature done:**
  ```bash
  ng build job-mate && ng build wealth-mate
  ```
- Check for **circular dependencies** if a shared lib import causes unexpected errors.

---

## 🚫 Never Do These

| Pattern                                          | Why                                           |
| ------------------------------------------------ | --------------------------------------------- |
| `ngModel` on any form input                      | Outdated template-driven approach             |
| `@Input()` / `@Output()` decorators              | Replaced by `input()` / `output()` signals    |
| `NgModule` for new code                          | Standalone is the standard since Angular 17+  |
| `any` type without comment                       | Destroys type safety                          |
| `console.log` left in committed code             | Use proper error handling or a logger service |
| Updating `decision.md`/`workflow.md` mid-feature | Causes noise; update only on completion       |
| Choosing a persistence strategy without asking   | May require full refactor later               |
| Skipping Playwright run after UI change          | Regressions go undetected                     |
| Zone.js re-introduction                          | Violates zoneless architecture                |

---

## 🔗 Reference

- Angular 21 official docs: https://angular.dev
- Signal Forms guide: https://angular.dev/guide/forms/signals/overview
- Angular Aria: https://angular.dev (search `@angular/aria`)
- Playwright docs: https://playwright.dev
- NgRx SignalStore: https://ngrx.io/guide/signals/signal-store
