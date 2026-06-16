import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export type SeoConfig = {
  readonly title: string;
  readonly description: string;
  readonly url?: string;
  readonly image?: string;
  readonly type?: 'website' | 'profile';
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  set(config: SeoConfig): void {
    const fullTitle = `${config.title} | Pulse`;

    this.title.setTitle(fullTitle);

    // Standard
    this.meta.updateTag({ name: 'description', content: config.description });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:type', content: config.type ?? 'website' });
    if (config.url) {
      this.meta.updateTag({ property: 'og:url', content: config.url });
    }
    if (config.image) {
      this.meta.updateTag({ property: 'og:image', content: config.image });
    }

    // Twitter / X card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    if (config.image) {
      this.meta.updateTag({ name: 'twitter:image', content: config.image });
    }

    // Canonical
    if (config.url) {
      this.setCanonical(config.url);
    }
  }

  addJsonLd(id: string, schema: Record<string, unknown>): void {
    const existing = this.doc.head.querySelector<HTMLScriptElement>(`script[data-ld="${id}"]`);
    if (existing) {
      existing.text = JSON.stringify(schema);
      return;
    }
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-ld', id);
    script.text = JSON.stringify(schema);
    this.doc.head.appendChild(script);
  }

  private setCanonical(url: string): void {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
