import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { PosthogService } from './core/services/posthog.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly posthog = inject(PosthogService);
  private readonly auth = inject(AuthService);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user) {
        this.posthog.identify(user.id, { email: user.email });
      } else {
        this.posthog.reset();
      }
    });
  }

  ngOnInit(): void {
    this.posthog.init(environment.posthogKey, {
      api_host: environment.posthogHost,
      defaults: '2026-01-30',
      capture_exceptions: true,
      capture_pageview: false,
    });

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.posthog.capture('$pageview', { $current_url: window.location.href });
    });
  }

  readonly showShell = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects !== '/' && e.urlAfterRedirects !== '/auth'),
    ),
    { initialValue: this.router.url !== '/' && this.router.url !== '/auth' },
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
