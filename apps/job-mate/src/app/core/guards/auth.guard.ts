import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

export const authGuard = () => {
  const auth = inject(AuthService);
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (!supabase.isConfigured) return true;

  // Wait until the initial getSession() call finishes before deciding
  return toObservable(auth.loading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => auth.isAuthenticated() || router.createUrlTree(['/auth'])),
  );
};
