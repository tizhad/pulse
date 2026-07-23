# Pulse — Feature Workflow Log

> Append an entry here when a feature is fully complete and verified.

---

## Landing Page Redesign — completed 2026-05-09

- Rewrote `landing.component.html` and `landing.component.scss` to match Lovable reference design
- Hero section with ambient blobs, pulsing logo mark, animated live badge, SVG underline on heading
- Feature cards with `@switch` for inline SVG icons, workflow card, testimonial strip, gradient CTA footer
- Google OAuth CTA buttons routing to `/auth`
- Projects affected: `job-mate`
- Playwright test added: no

---

## Pulse Branding (Favicon + Sidebar Logo) — completed 2026-05-09

- Created `public/favicon.svg` — gradient rectangle with Activity heartbeat path (matches logo mark)
- Updated `index.html` title to "Pulse" and switched favicon link to `image/svg+xml`
- Updated `app.html` sidebar: replaced "J" lettermark with gradient SVG Activity icon + "PULSE / INTERVIEW OS" lockup
- Updated `app.scss` with `.logo-mark`, `.logo-text`, `.logo-name`, `.logo-sub` styles
- Projects affected: `job-mate`
- Playwright test added: no

---

## Ask AI Page (Coming Soon UI) — completed 2026-05-09

- Created `ask-ai.component.ts/html/scss` with three states: idle, loading (1.2 s mock delay), ready
- Idle: three explanation cards; Loading: pulsing skeleton; Ready: 2-col layout — outline + Q&A accordion (native `<details>`) + code block on left, save card + toggles + disclaimer on right
- Added `/ask` route (auth-guarded, lazy-loaded) to `app.routes.ts`
- Added Ask AI nav item with "Soon" badge to `app.html` sidebar
- Projects affected: `job-mate`
- Playwright test added: no

---

## Subjects Table Enhancements — completed 2026-05-09

- **Category column:** Added Category column between Subject and Status in the subjects table; added `categoryLabel()` helper; added `.category-badge` global style; updated grid from 3 to 4 columns
- **Sort functionality:** Added `sorted` computed signal that applies sort order (priority, title, Q&A count, status) reactively to `store.filtered()`; sort buttons now reorder the table live
- **Inline status dropdown:** Clicking the status badge opens a small popover with all 5 status options; selecting one calls `store.updateSubject()` and closes the menu; backdrop dismisses on outside click; each status has a distinct colour (gray / blue / amber / teal / green)
- Added per-status CSS variables and `.badge` modifier classes (`status-not-started` through `status-mastered`) to `styles.scss`
- Projects affected: `job-mate`
- Playwright test added: no

---

## Subject Creation Navigation Fix — completed 2026-05-09

- After `store.addSubject()` resolves, navigate to `/subjects/:id` (new subject detail) instead of staying on `/subjects`
- Changed default category from `'javascript'` to `'angular'` in both `FormControl` definition and `openForm()` reset
- Projects affected: `job-mate`
- Playwright test added: no

---

## Subject Detail — Note View/Edit Mode — completed 2026-05-09

- Notes tab now defaults to read-only view: renders saved HTML via `[innerHTML]`, shows "Edit note" button
- Clicking "Edit note" enters edit mode: shows Tiptap rich editor + Cancel / Save Note buttons
- Cancel restores `noteHtml` from the store and returns to view mode
- Save Note persists the note (add or update) and navigates back to `/subjects`
- Note content displayed at 13.5 px matching editor size; read mode uses same border/bg container as the editor
- Projects affected: `job-mate`
- Playwright test added: no

---

## Add Company Drawer + Fix Application Save — completed 2026-05-10

- Companies: add drawer form (name, category select, status, notes) matching applications UX — slide-in panel, backdrop dismiss, saving state, empty state
- Applications: fix silent save failure caused by `location` field having `Validators.required` — made location optional
- Both: added `saving` signal to disable submit button and show "Saving…" during async write
- Projects affected: `job-mate`
- Playwright test added: no

---

## Application Sort — completed 2026-05-22

- Added a 6-pill sort bar to the applications page, sitting between the header and the card grid
- Sort options: Created date, Applied date, Last updated, Status (pipeline order), Job title, Company
- `sortedApplications` computed signal derives a sorted copy from the store reactively
- Clicking the active pill toggles asc/desc (shown via chevron); clicking a new pill switches to it with a sensible default direction (newest-first for dates, A→Z for text, pipeline order for status)
- Projects affected: `job-mate`
- Playwright test added: no

---

## Code Syntax Highlighting with Theme Switcher — completed 2026-05-10

- Installed `highlight.js`; 6 theme CSS files copied to `public/hljs-themes/` as static assets
- `<link id="hljs-theme">` in `index.html` — swapped at runtime by `CodeThemeService`
- `CodeThemeService` persists selected theme in `localStorage`; sets `--hljs-bg`, `--hljs-text-color`, `--hljs-border` CSS custom properties on `:root`
- Note read mode: `processedNoteHtml` computed signal runs `DOMParser` + `hljs.highlight()` on the note HTML string before binding — no DOM side effects
- Settings page: "Code theme" card with colour swatches (background + 4 token colour dots per theme) and a live TypeScript code preview that updates instantly on theme selection
- Themes available: GitHub Dimmed (default), GitHub Dark, Atom One Dark, Tokyo Night, Monokai, Atom One Light
- Projects affected: `job-mate`
- Playwright test added: no

---

## Guest Trial Limit (3 free items before sign-up) — completed 2026-07-23

- Signed-out visitors can now create up to 3 Subjects, 3 Companies, and 3 Applications before being prompted to sign up (previously every create action hard-blocked with a sign-in modal)
- New `GuestContentService` (`core/services/guest-content.service.ts`) — localStorage-backed, holds up to `GUEST_ITEM_LIMIT` (3) full items per entity type, same `StorageService` pattern used elsewhere in the app
- `StudyStore`/`CompanyStore`/`ApplicationStore` each gained a guest branch in their `addX` method and a `migrateGuest*` step that uploads local guest items to Supabase and clears local storage the moment the guest signs in/up — no data lost
- Guest items render in the exact same list/filter/sort UI as real data (merged into the same store signal), so guests genuinely get to try the feature, not a stripped-down preview
- `AuthModalService.open(mode, reason)` — now supports opening pre-selected on "Create account" with a contextual message (e.g. "You've added 3 free subjects — sign up to keep building your study plan."); existing no-arg call sites are unaffected
- Small "N free left" hint added near each "Add" button, visible only to guests
- Scope: create-only for guests. Editing/deleting still requires a full account (unchanged) — see DECISIONS.md D-030 for why
- Follow-up: `GuestContentService` now seeds every first-time guest's Subjects list with 2 samples (RxJS, Signals) via `buildSampleSubjects()`; they count toward the 3-item limit like any real guest item, so a fresh guest starts with 1 free subject slot, not 3. Seeding only happens once (keyed on whether `guest_subjects` has ever been saved) and the samples migrate to Supabase on sign-up same as any other guest item.
- Projects affected: `job-mate`
- Playwright test added: yes (`e2e/guest-limits.spec.ts` — sample subjects present on first visit, guest can add 1 more, next prompts sign-up, guest items persist across reload)
