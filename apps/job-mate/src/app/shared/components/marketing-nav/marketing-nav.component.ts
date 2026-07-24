import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface MarketingNavLink {
  readonly label: string;
  readonly routerLink: string | readonly string[];
  readonly fragment?: string;
}

export interface MarketingNavCta {
  readonly label: string;
  readonly href: string;
}

@Component({
  selector: 'app-marketing-nav',
  templateUrl: './marketing-nav.component.html',
  styleUrl: './marketing-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class MarketingNavComponent {
  readonly logoSubtitle = input.required<string>();
  readonly links = input.required<readonly MarketingNavLink[]>();
  readonly cta = input<MarketingNavCta | null>(null);

  readonly ctaClick = output<void>();

  readonly mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
