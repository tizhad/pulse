import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { email, form, required, submit, FormField } from '@angular/forms/signals';
import { PosthogService } from '../../../core/services/posthog.service';
import { SeoService } from '../../../core/services/seo.service';
import { environment } from '../../../../environments/environment';
import { MarketingNavComponent, type MarketingNavLink } from '../../../shared/components/marketing-nav/marketing-nav.component';
import { MarketingFooterComponent } from '../../../shared/components/marketing-footer/marketing-footer.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

type WaitlistModel = { readonly email: string };

@Component({
  selector: 'app-saas-landing',
  templateUrl: './saas-landing.component.html',
  styleUrl: './saas-landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarketingNavComponent, MarketingFooterComponent, RevealDirective, FormField],
})
export class SaasLandingComponent implements OnInit {
  private readonly posthog = inject(PosthogService);
  private readonly seo = inject(SeoService);

  readonly navLinks: readonly MarketingNavLink[] = [
    { label: 'Features', routerLink: [], fragment: 'features' },
    { label: 'Pricing', routerLink: [], fragment: 'pricing' },
    { label: 'FAQ', routerLink: [], fragment: 'faq' },
  ];

  protected readonly waitlistModel = signal<WaitlistModel>({ email: '' });
  protected readonly waitlistForm = form(this.waitlistModel, (path) => {
    required(path.email, { message: 'Enter your email to join the waitlist.' });
    email(path.email, { message: 'Enter a valid email address.' });
  });
  protected readonly submitted = signal(false);

  protected readonly features = [
    { title: 'Kanban boards', body: 'Drag tasks across custom stages your team actually uses, not a rigid preset.' },
    { title: 'Built-in team chat', body: 'Comment on a task and it shows up where your team already is — no Slack tab-switching.' },
    { title: 'Automations', body: 'When a task moves to "Done", the next one auto-assigns. Set it up once, forget it.' },
    { title: 'Time tracking', body: 'One click to start a timer. Reports roll up by project without a spreadsheet.' },
    { title: 'Reporting dashboards', body: 'See where work is stuck before your standup, not during it.' },
    { title: 'Integrations', body: 'Connects to the tools you already have. No migration weekend required.' },
  ] as const;

  protected readonly logos = ['Northwind', 'Acme Studio', 'Velocity', 'Brightlabs', 'Orbit Co.'] as const;

  protected readonly pricingTiers = [
    {
      name: 'Starter',
      price: '$0',
      cadence: 'forever',
      blurb: 'For small teams finding their rhythm.',
      features: ['Up to 5 members', '3 boards', 'Basic automations'],
      highlighted: false,
    },
    {
      name: 'Team',
      price: '$12',
      cadence: '/ member / mo',
      blurb: 'For teams that outgrew sticky notes.',
      features: ['Unlimited members', 'Unlimited boards', 'Advanced automations', 'Reporting dashboards'],
      highlighted: true,
    },
    {
      name: 'Business',
      price: '$24',
      cadence: '/ member / mo',
      blurb: 'For orgs that need control at scale.',
      features: ['Everything in Team', 'SSO', 'Audit logs', 'Priority support'],
      highlighted: false,
    },
  ] as const;

  protected readonly testimonials = [
    { quote: 'We finally have one place where status is actually up to date.', author: 'Sam K.', role: 'Operations Lead' },
    { quote: 'The automations alone saved us a full day a week of busywork.', author: 'Priya N.', role: 'Product Manager' },
  ] as const;

  protected readonly faqs = [
    { q: 'Is there a free plan?', a: 'Yes — the Starter plan is free forever for teams up to 5 people.' },
    { q: 'Can I import from Trello or Asana?', a: 'A one-click importer maps your existing boards and cards over in a few minutes.' },
    { q: 'Do you offer annual billing?', a: 'Yes, annual billing is available on Team and Business plans at a discount.' },
  ] as const;

  async handleWaitlistSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const ok = await submit(this.waitlistForm, async () => undefined);
    if (ok) {
      this.submitted.set(true);
      this.posthog.capture('landing_sample_saas_waitlist_submitted');
    }
  }

  ngOnInit(): void {
    this.seo.set({
      title: 'Flowdesk — Work flows better when it’s visible',
      description:
        'Flowdesk is a fictional team workflow SaaS built to demonstrate a landing page: feature grid, pricing tiers, and a working signup form in Angular 21.',
      url: `${environment.siteUrl}/landing-samples/saas`,
      noindex: true,
    });
    this.posthog.capture('landing_sample_saas_viewed');
  }
}
