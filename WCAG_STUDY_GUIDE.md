# WCAG 2.1 AA — Interview Prep & Study Guide

## Instructions for Claude Code

Build a standalone Angular 21 component called `WcagGuideComponent` that renders this entire study guide as an interactive UI. The component must match the following spec exactly.

---

## UI Spec

### Layout
- 5 tabs: **Principles**, **Key Criteria**, **Interview Q&A**, **Testing Tools**, **In Angular**
- Active tab content shown below, inactive tabs hidden
- Tab bar scrollable horizontally on mobile

### Design tokens (use Angular CDK or CSS custom properties)
- Cards: white background, 0.5px border, 12px border-radius, 1rem 1.25rem padding
- Badges/pills: 11px font, 999px border-radius, 3px 10px padding
- Code blocks: monospace font, secondary background, 0.5px border, 8px border-radius, 11px font
- All colours via CSS custom properties for light/dark mode support
- Colour scheme per badge type:
  - Perceivable (P): blue tint
  - Operable (O): green tint
  - Understandable (U): amber tint
  - Robust (R): purple tint
  - AA level: red/danger tint
  - Difficulty hard: red tint
  - Difficulty medium: amber tint
  - Difficulty easy: green tint

### Interactive behaviour
- **Principles tab**: expandable criterion cards (click to expand code example)
- **Interview Q&A tab**: accordion — click question to reveal model answer, click again to collapse
- **Key Criteria tab**: static cards with code blocks
- **Testing Tools tab**: responsive grid of tool cards
- **In Angular tab**: code block cards

### Angular 21 requirements
- Standalone component, Zoneless
- `@if` / `@for` control flow only
- `input()` / `output()` signals
- Tab state managed via `signal<string>('principles')`
- Accordion open state managed via `signal<string | null>(null)`
- `OnPush` change detection

---

## Content Data

Put all content in a `wcag-guide.data.ts` file. Never hardcode in the template.

---

### Tab 1 — Principles

#### Perceivable (P) — badge: blue
> Information and UI components must be presentable to users in ways they can perceive. If you can't see it, you must be able to hear or feel it.

| Criterion | Level | Description | Code example |
|---|---|---|---|
| 1.1.1 Non-text content | AA | Every image, icon, chart needs alt text. Decorative images get empty alt="". | `<img src="chart.png" alt="Revenue grew 30% in Q3" />` / `<img src="divider.png" alt="" role="presentation" />` |
| 1.3.1 Info and relationships | AA | Structure conveyed visually must also be in the DOM — use semantic HTML, not divs styled to look like headings. | `<!-- Wrong --> <div class="heading">Title</div>` / `<!-- Right --> <h2>Title</h2>` |
| 1.4.3 Contrast (minimum) | AA | Normal text: 4.5:1 ratio. Large text (18pt+ or 14pt bold): 3:1. | — |
| 1.4.4 Resize text | AA | Text must be readable at 200% zoom. Use rem/em, never px for font sizes. | — |
| 1.4.11 Non-text contrast | AA | UI components and focus indicators need 3:1 contrast against adjacent colours. | — |

#### Operable (O) — badge: green
> UI components and navigation must be operable. Everything a mouse can do, a keyboard must be able to do.

| Criterion | Level | Description | Code example |
|---|---|---|---|
| 2.1.1 Keyboard | AA | All functionality available via keyboard. Tab, Enter, Space, arrow keys must work. | — |
| 2.4.3 Focus order | AA | Focus must move in a logical sequence. Modals must trap focus. When closed, focus returns to trigger. | `import { FocusTrapFactory } from '@angular/cdk/a11y';` |
| 2.4.7 Focus visible | AA | Focus indicator must always be visible. Never use outline:none without a replacement. | `:focus-visible { outline: 2px solid #005FCC; outline-offset: 2px; }` |
| 2.5.3 Label in name | AA | Accessible name must contain the visible label text. | `<button aria-label="Close dialog">Close</button>` |

#### Understandable (U) — badge: amber
> Information and the operation of UI must be understandable.

| Criterion | Level | Description | Code example |
|---|---|---|---|
| 3.1.1 Language of page | AA | Set lang attribute on html element. | `<html lang="en">` |
| 3.2.2 On input | AA | Changing a setting must not automatically trigger a major context change. | — |
| 3.3.1 Error identification | AA | Errors must be described in text, not only by colour. Connect with aria-describedby. | `<input aria-describedby="email-error" aria-invalid="true" />` / `<span id="email-error" role="alert">Enter a valid email</span>` |
| 3.3.2 Labels or instructions | AA | Every input needs a visible label. Placeholder text alone is not a label. | — |

#### Robust (R) — badge: purple
> Content must be robust enough to be interpreted by assistive technologies.

| Criterion | Level | Description | Code example |
|---|---|---|---|
| 4.1.2 Name, role, value | AA | Every UI component must have an accessible name, correct role, and communicate its state. | `<button role="switch" aria-checked="true" aria-label="Dark mode">Dark mode</button>` |
| 4.1.3 Status messages | AA | Success/error messages must be announced without focus moving to them. | `<div role="status" aria-live="polite">Saved</div>` / `<div role="alert" aria-live="assertive">Error</div>` |

---

### Tab 2 — Key Criteria

#### Contrast ratios — know these numbers cold

| Label | Ratio | Description |
|---|---|---|
| Normal text (under 18pt) | 4.5 : 1 | The ratio of text colour to background colour |
| Large text (18pt+ or 14pt bold) | 3 : 1 | Headings, large UI text |
| UI components and focus rings | 3 : 1 | Borders of inputs, button outlines, focus indicators |
| AAA text (enhanced) | 7 : 1 | Not required for AA compliance but good to know |

#### ARIA — when to use and when NOT to use

**First rule of ARIA: don't use ARIA if a native HTML element exists.**

```
-- Use this:   <button>Submit</button>
-- Not this:   <div role="button" tabindex="0">Submit</div>
```

**aria-label vs aria-labelledby vs aria-describedby**
```
aria-label        — overrides visible text (use for icons, close buttons)
aria-labelledby   — points to existing text element as the label
aria-describedby  — adds supplementary info (errors, hints)
```

**aria-live regions**
```
aria-live="polite"    — waits for user to finish (toasts, saves)
aria-live="assertive" — interrupts immediately (errors, critical alerts)
role="status"         — polite shorthand
role="alert"          — assertive shorthand
```

**aria-hidden**
```
aria-hidden="true"  — hides from screen readers (decorative icons)
Never hide focusable elements with aria-hidden
```

#### Focus management

**Modal dialog pattern**
```
1. User clicks trigger
2. Modal opens — focus moves to first focusable element inside
3. Tab cycles ONLY within modal (focus trap)
4. Esc closes modal
5. Focus returns to the trigger element
```

**Skip navigation link**
```html
<a href="#main-content" class="skip-link">Skip to main content</a>

.skip-link { position: absolute; top: -40px; }
.skip-link:focus { top: 0; }
```

**tabindex values**
```
tabindex="0"   — adds to natural tab order
tabindex="-1"  — focusable via JS (.focus()) but not by Tab
tabindex="1+"  — avoid. Breaks natural tab order.
```

---

### Tab 3 — Interview Q&A

Each item: question (string), difficulty ('hard' | 'medium' | 'easy'), answer (string with \n for line breaks).

```typescript
export const INTERVIEW_QA = [
  {
    question: '"Tell me about the accessibility overhaul you did at ParkBee."',
    difficulty: 'hard',
    label: 'Most likely',
    answer: `When I joined ParkBee the app had no formal accessibility baseline. I ran a Lighthouse audit and a manual keyboard-only walkthrough — we had contrast failures on several CTAs, no visible focus indicators, missing alt text on feature images, and error messages only communicated by colour change.\n\nI prioritised by impact: contrast and focus indicators affect every user with low vision or who uses a keyboard, so those came first. I worked with design to update the colour palette to meet 4.5:1 for body text and 3:1 for large text and UI components. I replaced all outline:none rules with :focus-visible styles.\n\nFor forms I added aria-describedby linking inputs to their error messages and used role=alert for live validation. I also implemented a skip-to-content link. The result was WCAG 2.1 AA compliance across all user-facing surfaces — which also satisfied a regulatory requirement the company needed to meet.`
  },
  {
    question: '"What is the difference between AA and AAA compliance?"',
    difficulty: 'hard',
    label: 'Very likely',
    answer: `WCAG has three conformance levels — A, AA, and AAA. A is the minimum baseline, AA is the industry standard and what most regulations require, and AAA is the enhanced level which is often not achievable for all content.\n\nIn practice AA is what companies target. The key AA requirements I worked with most: 4.5:1 contrast for normal text, 3:1 for large text and UI components, all functionality keyboard accessible, visible focus indicators, and error messages in text. AAA goes further — 7:1 contrast, sign language interpretation for video, no timing restrictions at all.`
  },
  {
    question: '"How do you handle focus management in a modal dialog?"',
    difficulty: 'hard',
    label: 'Very likely',
    answer: `A modal has three focus management requirements: moving focus in, trapping focus inside, and restoring focus on close.\n\nWhen the modal opens, focus moves to the first focusable element inside it. While open, Tab must cycle only within the modal — this is a focus trap. When it closes, focus must return to the element that triggered it.\n\nIn Angular I use the CDK's FocusTrapFactory from @angular/cdk/a11y. The modal also needs role=dialog, aria-modal=true, and aria-labelledby pointing to its title. Escape key must close it.`
  },
  {
    question: '"When would you use aria-label vs aria-labelledby?"',
    difficulty: 'medium',
    label: 'Likely',
    answer: `aria-label provides an accessible name directly in the attribute — I use it when there is no visible text to reference, like an icon button: <button aria-label="Close dialog">.\n\naria-labelledby points to the ID of an existing visible element. I use it when the label is already on the page — for example in a modal: <div role="dialog" aria-labelledby="modal-title">. This is preferred because it references real visible text.\n\naria-describedby is different — it adds supplementary information, not the primary label. I use it to link inputs to their error messages or hint text.`
  },
  {
    question: '"What is the first rule of ARIA?"',
    difficulty: 'medium',
    label: 'Likely',
    answer: `The first rule of ARIA is: do not use ARIA if a native HTML element or attribute exists that already has the semantics and behaviour you need.\n\nFor example, using <button> is always better than <div role="button" tabindex="0"> — the native button gives you keyboard support, click handling, focus management and the correct role for free.\n\nARIA is for cases where no native element exists — like a custom date picker, a disclosure widget, or a live region for dynamic content.`
  },
  {
    question: '"How do you test for accessibility? What tools do you use?"',
    difficulty: 'medium',
    label: 'Likely',
    answer: `I use a combination of automated and manual testing because automated tools only catch around 30–40% of issues.\n\nAutomated: Lighthouse in Chrome DevTools for a quick baseline, axe DevTools browser extension for more detailed rule checking, and I integrate axe-core into Playwright E2E tests so accessibility is checked on every CI run.\n\nManual: Keyboard-only walkthrough — I unplug the mouse and navigate the full user journey using only Tab, Enter, Space, and arrow keys.\n\nScreen reader: I use NVDA on Windows or VoiceOver on Mac to test how content is actually announced. This catches things automated tools miss.`
  },
  {
    question: '"What is aria-live and when do you use polite vs assertive?"',
    difficulty: 'medium',
    label: 'Likely',
    answer: `aria-live tells screen readers to announce changes to a region without the user having to move focus there.\n\naria-live="polite" waits for the user to finish what they are doing before announcing. I use this for toasts, save confirmations, search result counts.\n\naria-live="assertive" interrupts the user immediately. I use this only for critical errors — session expired, payment failed. Overusing assertive is disruptive for screen reader users.\n\nrole="status" is shorthand for polite, and role="alert" is shorthand for assertive.`
  },
  {
    question: '"How would you make a custom dropdown accessible?"',
    difficulty: 'medium',
    label: 'Likely',
    answer: `A custom dropdown needs to implement the ARIA combobox or listbox pattern. The trigger button needs aria-haspopup="listbox" and aria-expanded toggling true/false. The options list needs role="listbox" and each option needs role="option" with aria-selected.\n\nKeyboard behaviour: Enter or Space opens it, arrow keys navigate, Enter selects, Escape closes and returns focus to trigger.\n\nHonestly — if you can use a native <select>, do that. Custom dropdowns require a lot of ARIA work and the native element is accessible for free.`
  },
  {
    question: '"What is the difference between visibility:hidden and aria-hidden?"',
    difficulty: 'easy',
    label: 'Possible',
    answer: `display:none — hidden visually AND from the accessibility tree. Not focusable.\n\nvisibility:hidden — hidden visually AND from the accessibility tree. Not focusable. Preserves layout space.\n\naria-hidden="true" — hidden from the accessibility tree only. Still visible on screen, still focusable. Use for decorative icons. Never put it on a focusable element — that creates a keyboard trap.`
  }
];
```

---

### Tab 4 — Testing Tools

```typescript
export const TESTING_TOOLS = [
  { name: 'Lighthouse', desc: 'Built into Chrome DevTools. Quick baseline audit. Good for catching obvious issues before committing.' },
  { name: 'axe DevTools', desc: 'Browser extension by Deque. More detailed than Lighthouse. The industry standard for automated a11y testing.' },
  { name: 'axe-core', desc: 'NPM package. Integrates with Playwright and Jest so accessibility runs in CI on every build.' },
  { name: 'NVDA', desc: 'Free screen reader for Windows. Pair with Firefox. Essential for manual screen reader testing.' },
  { name: 'VoiceOver', desc: 'Built into macOS and iOS. Use with Safari. Test mobile too — it behaves differently.' },
  { name: 'Colour Contrast Analyser', desc: 'Desktop app by TPGi. Pick any two colours and get the exact contrast ratio.' },
  { name: 'Accessibility Insights', desc: "Microsoft's browser extension. Has a guided manual test mode that walks through WCAG criteria one by one." },
  { name: 'Chrome a11y tree', desc: 'DevTools → Elements → Accessibility tab. Shows exactly what a screen reader sees for any element.' },
  { name: 'webaim.org/contrast', desc: 'The most commonly referenced contrast checker. Paste hex codes and get ratio + pass/fail.' },
  { name: 'whocanuse.com', desc: 'Shows how your colour combo looks across 8 types of colour blindness. Great for design conversations.' }
];
```

---

### Tab 5 — In Angular

```typescript
export const ANGULAR_PATTERNS = [
  {
    title: 'FocusTrap — for modals and drawers',
    code: `import { FocusTrapFactory } from '@angular/cdk/a11y';

// In component
this.focusTrap = this.focusTrapFactory.create(this.el.nativeElement);
this.focusTrap.focusInitialElement();`
  },
  {
    title: 'LiveAnnouncer — for screen reader announcements',
    code: `import { LiveAnnouncer } from '@angular/cdk/a11y';

this.liveAnnouncer.announce('Form saved', 'polite');
this.liveAnnouncer.announce('Error: session expired', 'assertive');`
  },
  {
    title: 'AriaDescriber — for tooltips',
    code: `import { AriaDescriber } from '@angular/cdk/a11y';
// Adds aria-describedby linking dynamically`
  },
  {
    title: 'Skip navigation link',
    code: `<a href="#main" class="skip-link">Skip to main content</a>
<main id="main">
  <router-outlet />
</main>`
  },
  {
    title: 'Route change announcements — the SPA problem',
    code: `// On NavigationEnd, announce the new page title
this.router.events.pipe(
  filter(e => e instanceof NavigationEnd)
).subscribe(() => {
  this.liveAnnouncer.announce(
    \`Navigated to \${this.title.getTitle()}\`, 'polite'
  );
});`
  },
  {
    title: 'Why route announcements matter (tell this in interviews)',
    code: `// In traditional sites, page navigation announces the new page
// to screen readers automatically.
// In SPAs, the URL changes but the page does not reload —
// so screen readers are silent. You must manually announce
// route changes using LiveAnnouncer.
// This is a common gotcha that most candidates miss.`
  }
];
```

---

## First message to send Claude Code

> Read WCAG_STUDY_GUIDE.md fully before writing any code. Create the data file first at src/app/data/wcag-guide.data.ts, then scaffold WcagGuideComponent as a standalone Zoneless Angular 21 component using signals for tab and accordion state. Use @if and @for control flow only. Match the UI spec in the file exactly. Ask me before making any assumptions.
