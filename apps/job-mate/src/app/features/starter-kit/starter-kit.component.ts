import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PosthogService } from '../../core/services/posthog.service';
import { SeoService } from '../../core/services/seo.service';
import { environment } from '../../../environments/environment';
import {
  MarketingNavComponent,
  type MarketingNavLink,
  type MarketingNavCta,
} from '../../shared/components/marketing-nav/marketing-nav.component';
import { MarketingFooterComponent } from '../../shared/components/marketing-footer/marketing-footer.component';

@Component({
  selector: 'app-starter-kit',
  templateUrl: './starter-kit.component.html',
  styleUrl: './starter-kit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarketingNavComponent, MarketingFooterComponent],
})
export class StarterKitComponent implements OnInit {
  private readonly posthog = inject(PosthogService);
  private readonly seo = inject(SeoService);

  readonly checkoutUrl = 'https://tizhad.lemonsqueezy.com/checkout/buy/8fdc839b-9dd8-40cb-95e5-a398656980d1';

  readonly navLinks: readonly MarketingNavLink[] = [
    { label: 'Job Mate', routerLink: ['/'] },
    { label: 'Portfolio', routerLink: ['/portfolio'] },
  ];

  readonly navCta: MarketingNavCta = { label: 'Get the kit — €69', href: this.checkoutUrl };

  trackCheckout(): void {
    this.posthog.capture('starter_kit_checkout_started');
  }

  ngOnInit(): void {
    this.seo.set({
      title: 'Angular 21 SaaS Starter Kit — Skip the boilerplate',
      description:
        'Angular 21 + Supabase + Signals. Full auth, dark mode, SSR, PostHog analytics, AI chat UI and more. €69 one-time payment.',
      url: `${environment.siteUrl}/starter-kit`,
    });
    this.seo.addJsonLd('starter-kit', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Angular 21 SaaS Starter Kit',
      description:
        'Full-featured Angular 21 SaaS starter with Supabase auth, SSR, dark mode, PostHog analytics, and AI chat UI.',
      url: `${environment.siteUrl}/starter-kit`,
      offers: {
        '@type': 'Offer',
        price: '69',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
      },
    });
    this.posthog.capture('starter_kit_page_viewed');
  }

  readonly features = [
    {
      iconName: 'lock',
      dark: false,
      title: 'Complete auth flow',
      body: 'Sign in, sign up, forgot password, and reset — all wired to Supabase. Show/hide password toggle included.',
      badge: 'Supabase',
    },
    {
      iconName: 'zap',
      dark: true,
      title: 'Zoneless + Signals',
      body: 'Angular 21 with zoneless change detection throughout. Signals, computed, and effect — no Zone.js baggage.',
      badge: 'Angular 21',
    },
    {
      iconName: 'sun',
      dark: false,
      title: 'Theme system',
      body: 'Light, dark, and system preference — persisted per user and applied on load without a flash of wrong theme.',
      badge: '3 modes',
    },
    {
      iconName: 'server',
      dark: false,
      title: 'SSR + prerendering',
      body: 'Express-powered server-side rendering and static prerendering, ready for production deployment.',
      badge: 'Express',
    },
    {
      iconName: 'database',
      dark: true,
      title: 'Signal store',
      body: 'NgRx SignalStore with Supabase CRUD and optimistic updates. State that stays in sync without the boilerplate.',
      badge: 'Optimistic',
    },
    {
      iconName: 'bar-chart',
      dark: false,
      title: 'PostHog analytics',
      body: 'Analytics with user identification wired in from day one. Know who is using your product, not just how many.',
      badge: 'Wired up',
    },
    {
      iconName: 'search',
      dark: false,
      title: 'SEO service',
      body: 'OG tags, Twitter cards, JSON-LD schema, and canonical URLs — one service call per page.',
      badge: 'Full kit',
    },
    {
      iconName: 'message-square',
      dark: false,
      title: 'AI chat UI',
      body: 'A full chat interface ready to plug into any LLM. Just swap in your API call and ship.',
      badge: 'Plug in LLM',
    },
    {
      iconName: 'layout',
      dark: true,
      title: 'Responsive sidebar',
      body: 'Production-grade layout with a collapsible sidebar and mobile drawer menu, no extra libraries needed.',
      badge: 'Mobile-ready',
    },
  ] as const;

  readonly techStack = [
    'Angular 21',
    'TypeScript',
    'Supabase',
    'SCSS',
    'PostHog',
    'NgRx Signals',
    'Express SSR',
    'MIT License',
  ] as const;

  readonly checklist = [
    'All 9 features listed above',
    'Full TypeScript strict mode',
    'SCSS design system with dark mode',
    'Playwright E2E test scaffolding',
    'Clean commit history to fork from',
    'MIT license — use in unlimited projects',
    'Free updates for the lifetime of v1',
  ] as const;
}
