import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly supabase = inject(SupabaseService);

  readonly mode = signal<'signin' | 'signup'>('signin');
  readonly email = signal('');
  readonly password = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);

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

    // If already signed in after signup (email confirmation disabled), go straight to dashboard.
    // Otherwise show the confirmation message.
    if (this.mode() === 'signup' && !this.auth.isAuthenticated()) {
      this.errorMessage.set('Check your email to confirm your account.');
      return;
    }

    await this.router.navigate(['/dashboard']);
  }
}
