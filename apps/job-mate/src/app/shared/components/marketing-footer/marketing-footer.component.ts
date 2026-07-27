import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface MarketingFooterLink {
  readonly label: string;
  readonly routerLink?: string | readonly string[];
  readonly href?: string;
  readonly external?: boolean;
}

export interface MarketingFooterCta {
  readonly label: string;
  readonly routerLink?: string | readonly string[];
  readonly href?: string;
  readonly external?: boolean;
}

@Component({
  selector: 'app-marketing-footer',
  templateUrl: './marketing-footer.component.html',
  styleUrl: './marketing-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class MarketingFooterComponent {
  readonly eyebrow = input.required<string>();
  readonly headlinePrefix = input.required<string>();
  readonly headlineAccent = input.required<string>();
  readonly headlineSuffix = input<string>('');
  readonly cta = input.required<MarketingFooterCta>();
  readonly links = input<readonly MarketingFooterLink[]>([]);

  readonly year = new Date().getFullYear();
}
