import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

// Public marketing routes stay lazy-until-visited; only authenticated app
// routes get preloaded in the background after the initial page settles.
const PUBLIC_ROUTE_PATHS = new Set<string>([
  '',
  'portfolio',
  'about',
  'contact',
  'starter-kit',
  'landing-samples',
  'landing-samples/saas',
  'landing-samples/fintech',
  'landing-samples/dev-tool',
  'thank-you',
  'download',
]);

@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const path = route.path ?? '';
    if (PUBLIC_ROUTE_PATHS.has(path)) {
      return of(null);
    }
    return load();
  }
}
