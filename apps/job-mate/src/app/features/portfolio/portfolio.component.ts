import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { environment } from '../../../environments/environment';
import { MarketingFooterComponent } from '../../shared/components/marketing-footer/marketing-footer.component';

const NAV_SCROLL_OFFSET = 84;

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarketingFooterComponent],
})
export class PortfolioComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly document = inject(DOCUMENT);

  readonly techStack = [
    'Angular',
    'TypeScript',
    'RxJS',
    'Signals',
    'NgRx',
    'Nx Monorepo',
    'GraphQL',
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
      title: 'Frontend Engineer & Product Thinker',
      description:
        'Frontend engineer with 5+ years shipping product-grade interfaces. Deep Angular expertise, PM background at a 50M-user super-app. Amsterdam-based.',
      url,
      type: 'profile',
    });
    this.seo.addJsonLd('about-person', {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Tizhad',
      jobTitle: 'Frontend Engineer',
      description:
        'Frontend engineer with 5+ years of delivery experience and a background as a Technical Product Manager.',
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
        'TypeScript',
        'RxJS',
        'Nx',
        'Frontend Engineering',
        'Product Management',
      ],
    });
  }
}
