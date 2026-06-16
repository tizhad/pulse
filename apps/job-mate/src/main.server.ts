import { bootstrapApplication } from '@angular/platform-browser';
import { config } from './app/app.config.server';
import { App } from './app/app';

// The context arg carries the platformRef injected by Angular's SSR route-extractor.
// Without it, bootstrapApplication throws NG0401 (Missing Platform) during prerender.
const bootstrap = (context?: Record<string, unknown>) =>
  bootstrapApplication(App, config, context as Parameters<typeof bootstrapApplication>[2]);

export default bootstrap;
