import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CryptoHolding, GoldHolding, GoldKarat, Holding } from '../models/asset.model';

// Manages the user's asset portfolio: gold and crypto holdings.
// Persisted to localStorage so the portfolio survives page reloads.
@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly KEY = 'pulse_portfolio_v1';
  private readonly _holdings = signal<Holding[]>([]);

  readonly holdings = this._holdings.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem(this.KEY);
      if (raw) this._holdings.set(JSON.parse(raw));
    }
  }

  private uid(): string {
    return crypto.randomUUID();
  }

  private save(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.KEY, JSON.stringify(this._holdings()));
    }
  }

  addGold(karat: GoldKarat, grams: number, description?: string): void {
    const h: GoldHolding = {
      id: this.uid(),
      type: 'gold',
      karat,
      grams,
      description: description?.trim() || undefined,
      addedAt: new Date().toISOString(),
    };
    this._holdings.update(hs => [...hs, h]);
    this.save();
  }

  addCrypto(
    coinId: string,
    coinName: string,
    coinSymbol: string,
    coinImage: string,
    amount: number,
    description?: string
  ): void {
    const h: CryptoHolding = {
      id: this.uid(),
      type: 'crypto',
      coinId,
      coinName,
      coinSymbol,
      coinImage,
      amount,
      description: description?.trim() || undefined,
      addedAt: new Date().toISOString(),
    };
    this._holdings.update(hs => [...hs, h]);
    this.save();
  }

  removeHolding(id: string): void {
    this._holdings.update(hs => hs.filter(h => h.id !== id));
    this.save();
  }
}
