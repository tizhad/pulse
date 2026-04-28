import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CoinMarket } from '../models/asset.model';

// All price data comes from CoinGecko's free public API (no key required).
// For gold we use PAX Gold (PAXG) — a gold-backed token where 1 PAXG = 1 troy oz,
// giving us current price plus 7d/30d historical change from the same endpoint.
@Injectable({ providedIn: 'root' })
export class PriceService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

  static readonly GOLD_COIN_ID = 'pax-gold';
  private readonly BASE = 'https://api.coingecko.com/api/v3';

  // Simple in-memory cache — avoids hammering CoinGecko on rapid navigations
  private cache = new Map<string, CoinMarket>();
  private cacheTime = 0;
  private readonly TTL = 5 * 60 * 1000; // 5 min

  private get stale(): boolean {
    return Date.now() - this.cacheTime >= this.TTL;
  }

  // Fetches current price + 7d/30d change for the given coin IDs.
  // Uses cache unless TTL has expired or a requested ID is missing.
  async fetchPrices(coinIds: string[]): Promise<Map<string, CoinMarket>> {
    if (!isPlatformBrowser(this.platformId)) return new Map();

    const toFetch = coinIds.filter(id => this.stale || !this.cache.has(id));

    if (toFetch.length) {
      try {
        const coins = await firstValueFrom(
          this.http.get<CoinMarket[]>(`${this.BASE}/coins/markets`, {
            params: {
              vs_currency: 'usd',
              ids: [...new Set(toFetch)].join(','),
              price_change_percentage: '7d,30d',
              sparkline: 'false',
            },
          })
        );
        for (const c of coins) this.cache.set(c.id, c);
        this.cacheTime = Date.now();
      } catch {
        // Silently fall through to stale cache rather than crashing the dashboard
      }
    }

    return new Map(
      coinIds.flatMap(id => {
        const c = this.cache.get(id);
        return c ? [[id, c] as [string, CoinMarket]] : [];
      })
    );
  }

  // Returns the top N coins by market cap — used to populate the crypto search dropdown.
  async fetchTopCoins(limit = 100): Promise<CoinMarket[]> {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      return await firstValueFrom(
        this.http.get<CoinMarket[]>(`${this.BASE}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: String(limit),
            page: '1',
            price_change_percentage: '7d,30d',
            sparkline: 'false',
          },
        })
      );
    } catch {
      return [];
    }
  }
}
