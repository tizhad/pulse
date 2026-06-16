import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Public pages — pre-rendered at build time for instant delivery + full SEO
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  // Auth and all protected routes — client-side only, no point SSR-ing gated content
  { path: '**', renderMode: RenderMode.Client },
];
