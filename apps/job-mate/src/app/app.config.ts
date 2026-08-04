import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withPreloading, withInMemoryScrolling } from '@angular/router';
import { appRoutes } from './app.routes';
import { SelectivePreloadingStrategy } from './core/strategies/selective-preloading.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withPreloading(SelectivePreloadingStrategy),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }),
    ),
  ],
};
