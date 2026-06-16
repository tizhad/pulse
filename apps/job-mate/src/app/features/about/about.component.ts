import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class AboutComponent implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    const url = `${environment.siteUrl}/about`;
    this.seo.set({
      title: 'Frontend Engineer & Product Thinker',
      description: 'Frontend engineer with 5+ years shipping product-grade interfaces. Deep Angular expertise, PM background at a 50M-user super-app. Amsterdam-based.',
      url,
      type: 'profile',
    });
    this.seo.addJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Tizhad',
      jobTitle: 'Frontend Engineer',
      description: 'Frontend engineer with 5+ years of delivery experience and a background as a Technical Product Manager.',
      url,
      email: 'tiizhad@gmail.com',
      sameAs: [
        'https://github.com/tizhad',
      ],
      address: { '@type': 'PostalAddress', addressLocality: 'Amsterdam', addressCountry: 'NL' },
      knowsAbout: ['Angular', 'React', 'TypeScript', 'RxJS', 'Nx', 'Frontend Engineering', 'Product Management'],
    });
  }
}
