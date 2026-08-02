import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PosthogService } from '../../../core/services/posthog.service';
import { SeoService } from '../../../core/services/seo.service';
import { environment } from '../../../../environments/environment';
import { MarketingNavComponent, type MarketingNavLink } from '../../../shared/components/marketing-nav/marketing-nav.component';
import { MarketingFooterComponent } from '../../../shared/components/marketing-footer/marketing-footer.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-fintech-landing',
  templateUrl: './fintech-landing.component.html',
  styleUrl: './fintech-landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarketingNavComponent, MarketingFooterComponent, RevealDirective],
})
export class FintechLandingComponent implements OnInit {
  private readonly posthog = inject(PosthogService);
  private readonly seo = inject(SeoService);

  readonly navLinks: readonly MarketingNavLink[] = [
    { label: 'Features', routerLink: [], fragment: 'features' },
    { label: 'Security', routerLink: [], fragment: 'security' },
    { label: 'FAQ', routerLink: [], fragment: 'faq' },
  ];

  protected readonly trustBadges = [
    'Bank-level encryption',
    'Read-only bank connection',
    'Your data is never sold',
    'GDPR compliant',
  ] as const;

  protected readonly featureRows = [
    {
      title: 'Automatic categorization',
      body: 'Every transaction sorts itself into a category the moment it clears — groceries, rent, subscriptions. No manual tagging.',
      reverse: false,
    },
    {
      title: 'Shared budgets',
      body: 'Split a budget with a partner or roommate and see the same numbers in real time, without a shared spreadsheet going stale.',
      reverse: true,
    },
    {
      title: 'Bill reminders',
      body: 'Vaultly flags upcoming bills three days out, so a forgotten subscription never turns into a late fee.',
      reverse: false,
    },
  ] as const;

  protected readonly comparisonRows = [
    { label: 'Setup time', vaultly: '2 minutes', spreadsheet: '1–2 hours' },
    { label: 'Auto-syncs with your bank', vaultly: true, spreadsheet: false },
    { label: 'Works on mobile', vaultly: true, spreadsheet: false },
    { label: 'Shareable with a partner', vaultly: true, spreadsheet: 'Manually' },
    { label: 'Monthly cost', vaultly: 'Free', spreadsheet: 'Free' },
  ] as const;

  protected readonly faqs = [
    { q: 'Is my bank data safe?', a: 'Vaultly connects read-only — we can see balances and transactions, never move money, and encrypt everything in transit and at rest.' },
    { q: 'Which banks are supported?', a: 'Most major Dutch and EU banks connect directly. More are added every quarter.' },
    { q: 'Does Vaultly sell my data?', a: 'No. Ever. Vaultly makes money from an optional premium tier, not from your transaction history.' },
  ] as const;

  ngOnInit(): void {
    this.seo.set({
      title: 'Vaultly — See where your money actually goes',
      description:
        'Vaultly is a fictional budgeting app built to demonstrate a landing page: trust badges, alternating feature rows, and a comparison table in Angular 21.',
      url: `${environment.siteUrl}/landing-samples/fintech`,
      noindex: true,
    });
    this.posthog.capture('landing_sample_fintech_viewed');
  }
}
