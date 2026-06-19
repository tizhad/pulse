import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);

  private readonly headers = {
    Authorization: `Bearer ${environment.supabase.anonKey}`,
    'Content-Type': 'application/json',
  };

  createCheckoutSession(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      `${environment.supabase.url}/functions/v1/create-checkout-session`,
      {},
      { headers: this.headers },
    );
  }

  getDownloadUrl(token: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      `${environment.supabase.url}/functions/v1/get-download-url`,
      { token },
      { headers: this.headers },
    );
  }
}
