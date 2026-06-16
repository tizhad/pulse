import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { PosthogService } from '../../core/services/posthog.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  private readonly auth = inject(AuthService);
  private readonly authModal = inject(AuthModalService);
  readonly supabase = inject(SupabaseService);
  private readonly posthog = inject(PosthogService);

  readonly mode = signal<'signin' | 'signup'>('signin');
  readonly email = signal('');
  readonly password = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);

  close(): void {
    this.authModal.close();
  }

  toggleMode(): void {
    this.mode.update(m => m === 'signin' ? 'signup' : 'signin');
    this.errorMessage.set(null);
  }

  async submit(): Promise<void> {
    this.errorMessage.set(null);
    this.loading.set(true);

    const error = this.mode() === 'signin'
      ? await this.auth.signIn(this.email(), this.password())
      : await this.auth.signUp(this.email(), this.password());

    this.loading.set(false);

    if (error) {
      this.errorMessage.set(error.message);
      return;
    }

    if (this.mode() === 'signup' && !this.auth.isAuthenticated()) {
      this.errorMessage.set('Check your email to confirm your account.');
      return;
    }

    const user = this.auth.user();
    if (user) {
      this.posthog.identify(user.id, { email: user.email });
    }

    this.posthog.capture(
      this.mode() === 'signup' ? 'user_signed_up' : 'user_signed_in',
      { email: this.email() },
    );

    this.authModal.close();
  }
}
