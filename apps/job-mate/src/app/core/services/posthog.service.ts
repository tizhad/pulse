import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type posthog from 'posthog-js';
import type { PostHogConfig, Properties } from 'posthog-js';

@Injectable({ providedIn: 'root' })
export class PosthogService {
  private readonly platformId = inject(PLATFORM_ID);
  private instance: typeof posthog | null = null;

  private get ph(): typeof posthog {
    if (isPlatformBrowser(this.platformId) && this.instance) {
      return this.instance;
    }
    return new Proxy({} as typeof posthog, { get: () => () => undefined });
  }

  // posthog-js is dynamically imported so its ~125KB isn't part of the
  // eager initial bundle — it becomes its own chunk, fetched only once
  // the browser actually calls init() (see App's afterNextRender).
  async init(apiKey: string, options: Partial<PostHogConfig>): Promise<void> {
    if (isPlatformBrowser(this.platformId) && !this.instance) {
      const { default: posthogInstance } = await import('posthog-js');
      posthogInstance.init(apiKey, options);
      this.instance = posthogInstance;
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
