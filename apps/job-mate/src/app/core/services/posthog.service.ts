import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import posthog, { PostHogConfig, Properties } from 'posthog-js';

@Injectable({ providedIn: 'root' })
export class PosthogService {
  private readonly platformId = inject(PLATFORM_ID);
  private initialized = false;

  private get ph(): typeof posthog {
    if (isPlatformBrowser(this.platformId) && this.initialized) {
      return posthog;
    }
    return new Proxy({} as typeof posthog, { get: () => () => undefined });
  }

  init(apiKey: string, options: Partial<PostHogConfig>): void {
    if (isPlatformBrowser(this.platformId) && !this.initialized) {
      posthog.init(apiKey, options);
      this.initialized = true;
    }
  }

  capture(event: string, properties?: Properties): void {
    this.ph.capture(event, properties);
  }

  identify(userId: string, properties?: Properties): void {
    this.ph.identify(userId, properties);
  }

  reset(): void {
    this.ph.reset();
  }
}
