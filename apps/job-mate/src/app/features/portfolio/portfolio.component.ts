import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { environment } from '../../../environments/environment';
import { MarketingFooterComponent } from '../../shared/components/marketing-footer/marketing-footer.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { CountUpDirective } from '../../shared/directives/count-up.directive';

const NAV_SCROLL_OFFSET = 84;

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgOptimizedImage,
    MarketingFooterComponent,
    RevealDirective,
    CountUpDirective,
  ],
})
export class PortfolioComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly document = inject(DOCUMENT);

  readonly techStack = [
    'Angular',
    'React',
    'Next.js',
    'TypeScript',
    'RxJS',
    'Signals',
    'NgRx',
    'Nx Monorepo',
    'GraphQL',
    'Datadog',
    'Playwright',
    'Jest',
    'SCSS',
  ] as const;

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    const target = this.document.getElementById(sectionId);
    const view = this.document.defaultView;
    if (!target || !view) {
      return;
    }
    const top = target.getBoundingClientRect().top + view.scrollY - NAV_SCROLL_OFFSET;
    view.scrollTo({ top, behavior: 'smooth' });
    view.history.replaceState(null, '', `/portfolio#${sectionId}`);
  }

  ngOnInit(): void {
    const url = `${environment.siteUrl}/portfolio`;
    this.seo.set({
      title: 'Tina Rezanezhad — Freelance Frontend Developer in Amsterdam',
      description:
        'Freelance frontend developer in Amsterdam, working in Angular, React and Next.js. I modernize legacy frontends, fix performance, and ship features end-to-end. Available for contract and interim work.',
      url,
      type: 'profile',
      absoluteTitle: true,
    });
    this.seo.addJsonLd('about-person', {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Tina Rezanezhad',
      alternateName: 'Tizhad',
      jobTitle: 'Freelance Frontend Developer',
      description:
        'Freelance frontend developer working in Angular, React and Next.js, with 5+ years of delivery experience and a background as a technical product manager at a 50M-user super-app.',
      url,
      email: 'tiizhad@gmail.com',
      sameAs: ['https://github.com/tizhad'],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Amsterdam',
        addressCountry: 'NL',
      },
      knowsAbout: [
        'Angular',
        'React',
        'Next.js',
        'TypeScript',
        'RxJS',
        'Nx',
        'Web Performance',
        'Datadog',
        'Technical SEO',
        'Structured Data',
        'Server-Side Rendering',
        'Frontend Engineering',
        'Product Management',
      ],
    });
  }
}
