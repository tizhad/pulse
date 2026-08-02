import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PosthogService } from '../../../core/services/posthog.service';
import { SeoService } from '../../../core/services/seo.service';
import { environment } from '../../../../environments/environment';
import { MarketingNavComponent, type MarketingNavLink } from '../../../shared/components/marketing-nav/marketing-nav.component';
import { MarketingFooterComponent } from '../../../shared/components/marketing-footer/marketing-footer.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';

@Component({
  selector: 'app-dev-tool-landing',
  templateUrl: './dev-tool-landing.component.html',
  styleUrl: './dev-tool-landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarketingNavComponent, MarketingFooterComponent, RevealDirective, CountUpDirective],
})
export class DevToolLandingComponent implements OnInit {
  private readonly posthog = inject(PosthogService);
  private readonly seo = inject(SeoService);

  readonly navLinks: readonly MarketingNavLink[] = [
    { label: 'Features', routerLink: [], fragment: 'features' },
    { label: 'Pricing', routerLink: [], fragment: 'pricing' },
    { label: 'FAQ', routerLink: [], fragment: 'faq' },
  ];

  protected readonly features = [
    { title: 'Auth, wired up', body: 'Sign in, sign up, forgot/reset — done before your first commit.' },
    { title: 'Zoneless + signals', body: 'No Zone.js. Signals and computed values throughout, the way Angular 21 intends it.' },
    { title: 'SSR out of the box', body: 'Server-rendered and prerendered pages, configured, not left as an exercise for you.' },
    { title: 'CI/CD templates', body: 'A working pipeline on day one — lint, test, build, deploy.' },
    { title: 'Testing setup', body: 'Vitest and Playwright pre-wired, with one example spec to copy from.' },
    { title: 'Docs site included', body: 'A documentation shell ready for your own product docs, no extra tooling to add.' },
  ] as const;

  protected readonly beforeCode = `// Before Forge Kit
const auth = inject(AuthService);
const router = inject(Router);
const form = new FormGroup({...});
async function onSubmit() {
  if (form.invalid) return;
  try {
    await auth.signIn(form.value);
    router.navigate(['/dashboard']);
  } catch (e) { /* ...and 30 more lines */ }
}`;

  protected readonly afterCode = `// After Forge Kit
const auth = inject(AuthStore);
protected readonly signInForm = form(this.model, loginSchema);

protected submit() {
  auth.signIn(this.signInForm().value());
}`;

  protected readonly testimonials = [
    { quote: 'Cut our SaaS bootstrap time from two weeks to an afternoon.', author: 'Backend engineer', role: 'fintech startup' },
    { quote: 'The zoneless setup alone would have taken me a full sprint to get right.', author: 'Frontend lead', role: 'agency' },
  ] as const;

  protected readonly checklist = [
    'All 6 features listed above',
    'Full TypeScript strict mode',
    'Playwright + Vitest scaffolding',
    'MIT license — unlimited projects',
  ] as const;

  protected readonly faqs = [
    { q: 'Is this a real npm package?', a: 'Forge Kit is a fictional product built to show what a dev-tool landing page looks like — not something you can install.' },
    { q: 'Would this style suit my real product?', a: 'This structure — terminal hero, stats, before/after comparison — works well for any tool with a technical audience.' },
  ] as const;

  ngOnInit(): void {
    this.seo.set({
      title: 'Forge Kit — Stop rebuilding the same 40 hours',
      description:
        'Forge Kit is a fictional developer-tool landing page built to demonstrate a terminal hero, animated stats, and a before/after code comparison in Angular 21.',
      url: `${environment.siteUrl}/landing-samples/dev-tool`,
      noindex: true,
    });
    this.posthog.capture('landing_sample_devtool_viewed');
  }
}
