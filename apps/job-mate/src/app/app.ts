import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  afterNextRender,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { CelebrationModalComponent } from './shared/components/celebration-modal/celebration-modal.component';
import { filter, map } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { AuthModalService } from './core/services/auth-modal.service';
import { PosthogService } from './core/services/posthog.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, AuthComponent, ToastComponent, CelebrationModalComponent],
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly posthog = inject(PosthogService);
  private readonly auth = inject(AuthService);
  readonly authModal = inject(AuthModalService);

  readonly user = this.auth.user;
  readonly isAuthenticated = this.auth.isAuthenticated;

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user) {
        this.posthog.identify(user.id, { email: user.email });
      } else {
        this.posthog.reset();
      }
    });

    // Deferred until after first paint so the PostHog SDK doesn't compete
    // with initial render on the landing page.
    afterNextRender(() => {
      void this.posthog.init(environment.posthogKey, {
        api_host: environment.posthogHost,
        defaults: '2026-01-30',
        capture_exceptions: true,
        capture_pageview: false,
        disable_surveys: true,
      });
    });
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.posthog.capture('$pageview');
    });
  }

  private static readonly noShellRoutes = ['/', '/portfolio', '/about', '/contact', '/starter-kit'];
  private static readonly noShellPrefixes = ['/landing-samples'];

  private static isShellRoute(url: string): boolean {
    const path = url.split('#')[0].split('?')[0];
    if (App.noShellRoutes.includes(path)) {
      return false;
    }
    return !App.noShellPrefixes.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  }

  readonly showShell = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => App.isShellRoute(e.urlAfterRedirects)),
    ),
    { initialValue: App.isShellRoute(this.router.url) },
  );

  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
