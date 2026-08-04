# Architecture Decisions Log

## Route-selective preloading over PreloadAllModules — 2026-08-04

**Context:** A Lighthouse audit of production `tizhad.com` (the public landing page) found ~250 KiB of unused JS on initial load. Part of the cause was `withPreloading(PreloadAllModules)` in `app.config.ts`, which background-fetches every lazy route chunk in the app — including the resume editor (Tiptap), the architecture page (mermaid+marked+highlight.js, 1MB+), and every authenticated dashboard route — immediately after a completely anonymous visitor lands on the public marketing page, none of which they have any reason to need yet.

**Decision:** Replaced `PreloadAllModules` with a custom `SelectivePreloadingStrategy` (`core/strategies/selective-preloading.strategy.ts`) that skips preloading for public marketing routes (`/`, `/portfolio`, `/about`, `/contact`, `/starter-kit`, `/landing-samples*`, `/thank-you`, `/download`) and preloads everything else (the authenticated app routes) as before. Also converted `PosthogService` to dynamically `import()` `posthog-js` rather than a static top-level import, and deferred its `init()` call to `afterNextRender()`, and swapped `provideAnimations()` for `provideAnimationsAsync()` since the app's only animation consumer was unrouted dead code.

**Alternatives considered:**
- Making `SupabaseService`'s client creation lazy too, since `AuthService` (needed app-wide for the sidebar's signed-in state) eagerly pulls in the full `@supabase/supabase-js` client on every route including the landing page where the sidebar doesn't render. Rejected for this pass: `SupabaseService.client`/`.from`/`.auth` are accessed synchronously throughout many feature files, so making it lazy is a real cross-cutting refactor, not a scoped fix — left as a documented, known gap rather than risking a broad undertested change.
- Deleting `StudyPlanComponent` (the dead code that was the animations engine's only justification for existing). Rejected: it's real, working code, just unrouted — without knowing whether it's abandoned or mid-migration WIP, deleting it is a bigger call than a performance fix should make unilaterally.

**Consequences:**
- Authenticated-route chunks (dashboard, subjects, resume editor, etc.) still preload in the background after landing on a public page is technically possible if a route is misclassified in `PUBLIC_ROUTE_PATHS` — the list needs to be kept in sync with `app.routes.ts` by hand; no automated check ties them together.
- The Supabase eager-load gap remains: the landing page still ships the full `@supabase/supabase-js` client (~75 KiB) even though it's not used there. Real fix requires either lazy-initializing `SupabaseService` or deferring `AuthService`'s construction specifically on shell-less routes — scoped as future work.
- Local Lighthouse re-testing after this change was inconclusive (static local server ≠ production CDN); the real before/after comparison requires a production deploy and a fresh live audit, not a local one.

## Editorial Design System Replacement — 2026-07-23

**Context:** JobMate had three visually inconsistent design languages that had accumulated over time: the cream/indigo CRUD product UI (Dashboard/Subjects/Companies/Applications/Settings), a dark terminal/hacker-themed `/portfolio` page from a recent rebuild, and a glassmorphism marketing style shared (via copy-pasted markup) between Landing and Starter-Kit. The user commissioned a Lovable-generated redesign of `/portfolio` — an editorial/agency aesthetic (Instrument Serif display headlines with an italic gold accent word, warm cream background, dark forest-green sections, muted gold accent, asymmetric bento-grid cards, a tech-stack marquee, dark footer CTAs) — and, after review, chose to roll it out across the entire application rather than just the one page.

**Decision:** Replaced all three design languages with one unified editorial system:
- Self-hosted **Instrument Serif** (display headlines) + **Work Sans** (body/UI), confirmed from the reference's actual computed styles rather than guessed.
- New palette: cream `#FAF8F2` background, forest green `#1A2E1F` (primary accent, replacing indigo `#6C5CE7`), gold `#A8875A` (secondary accent — eyebrow labels, italic headline swashes, nav-active state).
- New global utilities: `.eyebrow` (tracked-out micro-labels), `.bento-grid`/`.bento-card`, `.marquee`, pill-shaped `.btn-primary`, editorial `.page-title`/`.empty-state` typography — promoted to `styles.scss` after finding them duplicated near-identically across 7-9 feature components.
- Extracted `MarketingNavComponent`/`MarketingFooterComponent` (`shared/components/`) to eliminate the `ln-*`/`sk-*` copy-pasted nav and footer markup between Landing and Starter-Kit.
- Explicit density rule for the authenticated product UI: serif/editorial treatment is reserved for page titles, section eyebrows, empty states, and stat callouts; data tables, badges, forms, and the sidebar nav stay dense/sans-serif, unchanged in information density.
- Dropped the OS-driven `prefers-color-scheme: dark` auto dark-mode override (was tied to the retired indigo palette) rather than porting or redesigning it.
- The `/contact` page's pre-existing One Piece-themed easter egg (unrelated to any of the three known design languages, discovered mid-rollout) was also brought into the editorial system at the user's explicit choice, rather than left as a fourth inconsistent style.

**Alternatives considered:**
- Marketing-surfaces-only scope (Landing/Portfolio/Starter-Kit), leaving the authenticated dashboard on its existing cream/indigo system. Recommended initially due to the risk of an editorial aesthetic hurting scan-speed/density in daily-use CRUD screens; the user chose full-app scope instead, which this rollout's density rule was designed to make safe.
- Keeping the `/contact` pirate theme untouched, or only retinting its existing colors — the user chose a full rewrite to the editorial system instead.

**Consequences:**
- Dark-mode users now see the same light/cream theme as everyone else until a dedicated dark variant of the new palette is designed as a separate future task.
- The `/contact` page lost its pirate-themed personality/easter-egg content in favor of brand consistency.
- A pre-existing, unrelated bug was discovered and left untouched: the "Accent palette" picker in Settings (Indigo/Coral/Mint) saves a preference that nothing in the app actually reads back — it has no live effect. Not fixed, as it's a feature-completeness gap orthogonal to this visual redesign.
- A pre-existing `shell-navigation.spec.ts` test failure (expected 7 sidebar nav links, found 14 — two `<aside class="sidebar">` in the DOM) was investigated at length and traced to long-lived dev-server staleness, not a real code defect; it resolved on its own once the dev server did a full recompile during this work.

## Dashboard Streak: activity_days table over deriving from existing timestamps — 2026-07-27

**Context:** The dashboard's streak card (day count, 14-cell heatmap, weekly summary) had zero real logic behind it — hardcoded array, hardcoded strings. Fixing it required deciding what counts as a "day of activity" and how to persist it, since the schema had no activity/event log at all, only `study_subjects.last_reviewed_at` and `applications.created_at`/`updated_at`.

**Decision:**
- A day counts as active if the user did study work (a confidence review) OR job-search work (added an application / moved its pipeline status) — framed as overall job-search momentum, matching the landing page's existing "Streaks, heatmaps, and gentle nudges" marketing copy, not a narrow "study" streak.
- Added a dedicated `activity_days` table (one row per user per day, `study_count`/`application_count`) plus a `bump_activity()` RPC called from `study.store`/`application.store` mutations, rather than deriving the streak from existing `updated_at` columns.
- The weekly summary line ("Studied 4h 20m this week") was replaced with an activity count ("N activities this week") rather than kept as a fabricated duration — there is no time-tracking anywhere in the app.

**Alternatives considered:**
- Deriving streak/heatmap from `last_reviewed_at`/`created_at`/`updated_at` directly, with no new table. Rejected: `updated_at` gets overwritten on every edit so there's no real day-by-day history, and the heatmap's per-day intensity would be a rough guess at best rather than an accurate count.
- Real study-time tracking (a manual start/stop timer, or passive tab-focus/heartbeat tracking) to make the weekly summary an actual duration instead of an activity count. Explicitly scoped out as a separate future feature after discussion — a manual timer is the recommended starting point over passive tracking (accurate to intent, no idle-detection heuristics to get wrong), but it's a genuinely separate feature (new table, new UI surface, its own edge cases) and not part of this fix.
- Dropping the streak card entirely, on the grounds that "streak" reads as a student/Duolingo mechanic rather than a job-search one. Rejected after discussion: streaks are a general consistency-habit mechanic that fits daily job-search grind just as well, and the landing page already markets it as a feature.

**Consequences:**
- Guest (signed-out) users always see a 0/empty streak state, since `activity_days` only exists in Supabase and guest content is local-only — this was an explicit choice over building parallel local-only activity tracking for guests.
- `currentStreak()` fetches 90 days of history so a long streak isn't undercounted by the 14-day heatmap window, but a streak longer than 90 days would still be capped/undercounted; not addressed since it's far beyond realistic usage.
- Real "time spent studying" is not yet tracked anywhere; the dashboard now shows activity counts instead until a timer feature is designed.
