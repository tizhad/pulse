import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { CheckoutService } from '../../core/services/checkout.service';
import { SeoService } from '../../core/services/seo.service';

type DownloadState = 'loading' | 'error' | 'done';

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
  styleUrl: './download.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class DownloadComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly checkout = inject(CheckoutService);
  private readonly seo = inject(SeoService);
  private readonly doc = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly state = signal<DownloadState>('loading');
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.seo.set({
      title: 'Downloading your starter kit',
      description: 'Your Angular 21 SaaS Starter Kit download is starting.',
    });

    // Never run on the server — consuming the token is an irreversible side effect
    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.errorMessage.set('No download token found. Please use the link from your purchase email.');
      this.state.set('error');
      return;
    }

    this.checkout.getDownloadUrl(token).subscribe({
      next: ({ url }) => {
        this.state.set('done');
        // Redirect the browser to the signed URL — download starts automatically
        this.doc.location.href = url;
      },
      error: (err) => {
        const message = err.error?.error ?? 'Something went wrong. Please reply to your purchase email.';
        this.errorMessage.set(message);
        this.state.set('error');
      },
    });
  }
}
