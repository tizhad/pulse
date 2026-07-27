# Architecture Decisions Log

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
