import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PosthogService } from '../../core/services/posthog.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-thank-you',
  templateUrl: './thank-you.component.html',
  styleUrl: './thank-you.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class ThankYouComponent implements OnInit {
  private readonly posthog = inject(PosthogService);
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.set({
      title: 'Purchase complete — Angular 21 SaaS Starter Kit',
      description: 'Thank you for your purchase. Check your email for your download link.',
    });
    this.posthog.capture('starter_kit_purchased');
  }
}
