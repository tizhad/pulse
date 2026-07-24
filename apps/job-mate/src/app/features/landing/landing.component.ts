import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PosthogService } from '../../core/services/posthog.service';
import { SeoService } from '../../core/services/seo.service';
import { environment } from '../../../environments/environment';
import {
  MarketingNavComponent,
  type MarketingNavLink,
} from '../../shared/components/marketing-nav/marketing-nav.component';
import { MarketingFooterComponent } from '../../shared/components/marketing-footer/marketing-footer.component';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarketingNavComponent, MarketingFooterComponent],
})
export class LandingComponent implements OnInit {
  private readonly posthog = inject(PosthogService);
  private readonly seo = inject(SeoService);

  readonly navLinks: readonly MarketingNavLink[] = [
    { label: 'Features', routerLink: ['/'], fragment: 'features' },
    { label: 'About creator', routerLink: ['/portfolio'] },
  ];

  ngOnInit(): void {
    this.seo.set({
      title: 'Interview OS for serious candidates',
      description:
        'Track every subject, company and application. Build daily momentum and land the offer.',
      url: environment.siteUrl,
    });
    this.seo.addJsonLd('landing-app', {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Pulse',
      description:
        'Interview preparation OS — track subjects, companies, and applications.',
      url: environment.siteUrl,
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    });

    this.posthog.capture('landing_page_viewed');
  }

  readonly features = [
    {
      iconName: 'book-open',
      dark: false,
      title: 'Nest subjects forever',
      body: 'Break topics into sub-subjects (and sub-sub-subjects). Tag priority, status, and interview potential.',
      badge: 'Smart tree',
    },
    {
      iconName: 'building2',
      dark: true,
      title: 'Companies ↔ questions',
      body: 'See exactly which companies asked which question — and build a focused study plan from real signals.',
      badge: 'Linked',
    },
    {
      iconName: 'briefcase',
      dark: false,
      title: 'Application pipeline',
      body: 'Drag-and-drop kanban with status history, salary, notes, and a resume version saved per role.',
      badge: 'Kanban',
    },
    {
      iconName: 'target',
      dark: false,
      title: 'Priority that adapts',
      body: 'Pulse re-ranks your focus list based on upcoming interviews and the gaps in your prep.',
      badge: 'Adaptive',
    },
    {
      iconName: 'zap',
      dark: true,
      title: 'Resume per company',
      body: 'Upload a tailored PDF for every application. Diff versions and never lose your best line again.',
      badge: 'PDF vault',
    },
    {
      iconName: 'trending-up',
      dark: false,
      title: 'Daily heartbeat',
      body: "Streaks, heatmaps, and gentle nudges. See progress so clearly you can't help but keep going.",
      badge: 'Habits',
    },
  ] as const;

  readonly steps = [
    {
      num: '01',
      title: 'Capture',
      body: 'Drop in any subject, sub-subject or interview question in seconds. Tag the company that asked it.',
    },
    {
      num: '02',
      title: 'Prioritize',
      body: 'Pulse scores interview potential. Sort, search and surface what actually matters this week.',
    },
    {
      num: '03',
      title: 'Land',
      body: 'Track applications, attach the right resume, and walk into interviews with quiet confidence.',
    },
  ] as const;
}
