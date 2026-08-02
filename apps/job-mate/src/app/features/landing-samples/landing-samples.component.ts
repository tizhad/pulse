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
import { RevealDirective } from '../../shared/directives/reveal.directive';

interface LandingSample {
  readonly slug: string;
  readonly brand: string;
  readonly niche: string;
  readonly tagline: string;
  readonly demonstrates: string;
  readonly accentClass: string;
}

@Component({
  selector: 'app-landing-samples',
  templateUrl: './landing-samples.component.html',
  styleUrl: './landing-samples.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarketingNavComponent, MarketingFooterComponent, RevealDirective],
})
export class LandingSamplesComponent implements OnInit {
  private readonly posthog = inject(PosthogService);
  private readonly seo = inject(SeoService);

  readonly navLinks: readonly MarketingNavLink[] = [
    { label: 'Portfolio', routerLink: ['/portfolio'] },
    { label: 'Contact', routerLink: ['/contact'] },
  ];

  readonly samples: readonly LandingSample[] = [
    {
      slug: 'saas',
      brand: 'Flowdesk',
      niche: 'B2B productivity SaaS',
      tagline: 'Work flows better when it’s actually visible.',
      demonstrates: 'Feature bento grid, pricing tiers, and a working Signal Forms waitlist',
      accentClass: 'ls-accent-saas',
    },
    {
      slug: 'fintech',
      brand: 'Vaultly',
      niche: 'Consumer fintech app',
      tagline: 'See where your money actually goes.',
      demonstrates: 'Trust badges, alternating feature rows, and a comparison table',
      accentClass: 'ls-accent-fintech',
    },
    {
      slug: 'dev-tool',
      brand: 'Forge Kit',
      niche: 'Developer tool / boilerplate',
      tagline: 'Stop rebuilding the same 40 hours.',
      demonstrates: 'Terminal hero, animated stats, and a before/after code comparison',
      accentClass: 'ls-accent-devtool',
    },
  ] as const;

  ngOnInit(): void {
    this.seo.set({
      title: 'Landing Page Samples',
      description:
        'A small gallery of fictional-product landing pages built to show what I can build for your product: Angular 21, signals, and real polish.',
      url: `${environment.siteUrl}/landing-samples`,
      noindex: true,
    });
    this.posthog.capture('landing_samples_index_viewed');
  }
}
