import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PosthogService } from '../../core/services/posthog.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class LandingComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly posthog = inject(PosthogService);

  readonly ctaRoute = computed(() => (this.auth.isAuthenticated() ? '/dashboard' : '/auth'));

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.posthog.capture('landing_page_viewed');
    }
  }

  readonly trustedBy = ['Stripe', 'Linear', 'Notion', 'Figma', 'Vercel', 'Airbnb', 'Datadog'];

  readonly stars = [0, 1, 2, 3, 4];
  readonly year = new Date().getFullYear();

  readonly features = [
    {
      iconName: 'book-open',
      gradient: 'var(--gradient-cool)',
      title: 'Nest subjects forever',
      body: 'Break topics into sub-subjects (and sub-sub-subjects). Tag priority, status, and interview potential.',
      badge: 'Smart tree',
    },
    {
      iconName: 'building2',
      gradient: 'var(--gradient-warm)',
      title: 'Companies ↔ questions',
      body: 'See exactly which companies asked which question — and build a focused study plan from real signals.',
      badge: 'Linked',
    },
    {
      iconName: 'briefcase',
      gradient: 'var(--gradient-primary)',
      title: 'Application pipeline',
      body: 'Drag-and-drop kanban with status history, salary, notes, and a resume version saved per role.',
      badge: 'Kanban',
    },
    {
      iconName: 'target',
      gradient: 'var(--gradient-warm)',
      title: 'Priority that adapts',
      body: 'Pulse re-ranks your focus list based on upcoming interviews and the gaps in your prep.',
      badge: 'Adaptive',
    },
    {
      iconName: 'zap',
      gradient: 'var(--gradient-primary)',
      title: 'Resume per company',
      body: "Upload a tailored PDF for every application. Diff versions and never lose your best line again.",
      badge: 'PDF vault',
    },
    {
      iconName: 'trending-up',
      gradient: 'var(--gradient-cool)',
      title: 'Daily heartbeat',
      body: "Streaks, heatmaps, and gentle nudges. See progress so clearly you can't help but keep going.",
      badge: 'Habits',
    },
  ] as const;

  readonly steps = [
    {
      num: '01',
      tone: 'var(--coral)',
      title: 'Capture',
      body: 'Drop in any subject, sub-subject or interview question in seconds. Tag the company that asked it.',
    },
    {
      num: '02',
      tone: 'var(--amber)',
      title: 'Prioritize',
      body: 'Pulse scores interview potential. Sort, search and surface what actually matters this week.',
    },
    {
      num: '03',
      tone: 'var(--mint)',
      title: 'Land',
      body: 'Track applications, attach the right resume, and walk into interviews with quiet confidence.',
    },
  ] as const;
}
