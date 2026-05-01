import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import { PriceService } from '../../services/price.service';
import {
  CoinMarket,
  CryptoHolding,
  GoldKarat,
  GOLD_KARATS,
  Holding,
  TROY_OZ_IN_GRAMS,
} from '../../models/asset.model';

// Per-asset row data computed from holdings × live prices
interface AssetRow {
  holding: Holding;
  label: string;
  currentValue: number;
  priceChange7d: number;   // percentage
  priceChange30d: number;  // percentage
  valueChange7d: number;   // USD delta (approximation: value × pct/100)
  valueChange30d: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, CurrencyPipe, UpperCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly assetService = inject(AssetService);
  private readonly priceService = inject(PriceService);

  // Expose to template
  readonly GOLD_KARATS = GOLD_KARATS;
  readonly GOLD_ID = PriceService.GOLD_COIN_ID;

  readonly holdings = this.assetService.holdings;
  readonly prices = signal(new Map<string, CoinMarket>());
  readonly loading = signal(false);
  readonly error = signal('');

  // --- Add-panel state ---
  readonly showPanel = signal(false);
  readonly activeTab = signal<'gold' | 'crypto'>('gold');

  // Gold form
  readonly goldKarat = signal<GoldKarat>(18);
  readonly goldGrams = signal('');
  readonly goldDescription = signal('');

  // Crypto form
  readonly topCoins = signal<CoinMarket[]>([]);
  readonly topCoinsLoading = signal(false);
  readonly cryptoQuery = signal('');
  readonly selectedCoin = signal<CoinMarket | null>(null);
  readonly cryptoAmount = signal('');
  readonly cryptoDescription = signal('');
  readonly dropdownOpen = signal(false);

  // Coins shown in dropdown — filtered from top 100 as user types
  readonly filteredCoins = computed(() => {
    const q = this.cryptoQuery().toLowerCase().trim();
    if (!q) return this.topCoins().slice(0, 8);
    return this.topCoins()
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
      )
      .slice(0, 8);
  });

  // --- Gold add-form live preview ---

  readonly goldSpot = computed(() => this.prices().get(PriceService.GOLD_COIN_ID));

  readonly goldPreviewPerGram = computed(() => {
    const spot = this.goldSpot();
    if (!spot) return null;
    const purity = GOLD_KARATS.find(k => k.karat === this.goldKarat())?.purity ?? 0.75;
    return (spot.current_price * purity) / TROY_OZ_IN_GRAMS;
  });

  readonly goldPreviewTotal = computed(() => {
    const ppg = this.goldPreviewPerGram();
    const g = parseFloat(this.goldGrams());
    return ppg && g > 0 ? ppg * g : null;
  });

  // --- Crypto add-form live preview ---

  readonly cryptoPreviewTotal = computed(() => {
    const coin = this.selectedCoin();
    const amt = parseFloat(this.cryptoAmount());
    return coin && amt > 0 ? coin.current_price * amt : null;
  });

  // --- Portfolio computations ---

  readonly assetRows = computed((): AssetRow[] => {
    const priceMap = this.prices();

    return this.holdings().map(h => {
      if (h.type === 'gold') {
        const gold = priceMap.get(PriceService.GOLD_COIN_ID);
        const purity = GOLD_KARATS.find(k => k.karat === h.karat)?.purity ?? 0.75;
        const pricePerGram = gold ? (gold.current_price * purity) / TROY_OZ_IN_GRAMS : 0;
        const currentValue = h.grams * pricePerGram;
        const p7d = gold?.price_change_percentage_7d_in_currency ?? 0;
        const p30d = gold?.price_change_percentage_30d_in_currency ?? 0;
        return {
          holding: h,
          label: `Gold ${h.karat}K · ${h.grams}g`,
          currentValue,
          priceChange7d: p7d,
          priceChange30d: p30d,
          valueChange7d: currentValue * (p7d / 100),
          valueChange30d: currentValue * (p30d / 100),
        };
      }

      const coin = priceMap.get(h.coinId);
      const currentValue = coin ? h.amount * coin.current_price : 0;
      const p7d = coin?.price_change_percentage_7d_in_currency ?? 0;
      const p30d = coin?.price_change_percentage_30d_in_currency ?? 0;
      return {
        holding: h,
        label: `${h.coinName} · ${h.amount} ${h.coinSymbol.toUpperCase()}`,
        currentValue,
        priceChange7d: p7d,
        priceChange30d: p30d,
        valueChange7d: currentValue * (p7d / 100),
        valueChange30d: currentValue * (p30d / 100),
      };
    });
  });

  readonly totalValue = computed(() =>
    this.assetRows().reduce((s, r) => s + r.currentValue, 0)
  );

  // Weighted-average portfolio percentage change (weight = asset's share of total value)
  readonly portfolioPct7d = computed(() => {
    const total = this.totalValue();
    if (!total) return 0;
    return this.assetRows().reduce(
      (s, r) => s + r.priceChange7d * (r.currentValue / total),
      0
    );
  });

  readonly portfolioPct30d = computed(() => {
    const total = this.totalValue();
    if (!total) return 0;
    return this.assetRows().reduce(
      (s, r) => s + r.priceChange30d * (r.currentValue / total),
      0
    );
  });

  readonly portfolioChange7d = computed(() =>
    this.assetRows().reduce((s, r) => s + r.valueChange7d, 0)
  );

  readonly portfolioChange30d = computed(() =>
    this.assetRows().reduce((s, r) => s + r.valueChange30d, 0)
  );

  // --- Lifecycle ---

  async ngOnInit(): Promise<void> {
    await this.refreshPrices();
  }

  // --- Actions ---

  async refreshPrices(): Promise<void> {
    const coinIds = [
      PriceService.GOLD_COIN_ID,
      ...this.holdings()
        .filter((h): h is CryptoHolding => h.type === 'crypto')
        .map(h => h.coinId),
    ];
    this.loading.set(true);
    this.error.set('');
    try {
      this.prices.set(await this.priceService.fetchPrices(coinIds));
    } catch {
      this.error.set('Could not load live prices. Check your connection.');
    } finally {
      this.loading.set(false);
    }
  }

  openPanel(tab: 'gold' | 'crypto'): void {
    this.activeTab.set(tab);
    this.showPanel.set(true);
    if (tab === 'crypto' && this.topCoins().length === 0) {
      this.loadTopCoins();
    }
  }

  async loadTopCoins(): Promise<void> {
    this.topCoinsLoading.set(true);
    this.topCoins.set(await this.priceService.fetchTopCoins(100));
    this.topCoinsLoading.set(false);
  }

  onKaratChange(event: Event): void {
    this.goldKarat.set(+(event.target as HTMLSelectElement).value as GoldKarat);
  }

  onGoldGramsInput(event: Event): void {
    this.goldGrams.set((event.target as HTMLInputElement).value);
  }

  onGoldDescriptionInput(event: Event): void {
    this.goldDescription.set((event.target as HTMLInputElement).value);
  }

  onCryptoDescriptionInput(event: Event): void {
    this.cryptoDescription.set((event.target as HTMLInputElement).value);
  }

  onCryptoQueryInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.cryptoQuery.set(val);
    this.selectedCoin.set(null);
    this.dropdownOpen.set(true);
  }

  onCryptoAmountInput(event: Event): void {
    this.cryptoAmount.set((event.target as HTMLInputElement).value);
  }

  selectCoin(coin: CoinMarket): void {
    this.selectedCoin.set(coin);
    this.cryptoQuery.set(coin.name);
    this.dropdownOpen.set(false);
  }

  clearCoin(): void {
    this.selectedCoin.set(null);
    this.cryptoQuery.set('');
    this.dropdownOpen.set(false);
  }

  // Delayed close so a click on a dropdown item fires before the input loses focus
  scheduleDropdownClose(): void {
    setTimeout(() => this.dropdownOpen.set(false), 180);
  }

  addGold(): void {
    const grams = parseFloat(this.goldGrams());
    if (!grams || grams <= 0) return;
    this.assetService.addGold(this.goldKarat(), grams, this.goldDescription());
    this.goldGrams.set('');
    this.goldDescription.set('');
    this.showPanel.set(false);
    this.refreshPrices();
  }

  addCrypto(): void {
    const coin = this.selectedCoin();
    const amount = parseFloat(this.cryptoAmount());
    if (!coin || !amount || amount <= 0) return;
    this.assetService.addCrypto(
      coin.id, coin.name, coin.symbol, coin.image, amount, this.cryptoDescription()
    );
    this.selectedCoin.set(null);
    this.cryptoQuery.set('');
    this.cryptoAmount.set('');
    this.cryptoDescription.set('');
    this.showPanel.set(false);
    this.refreshPrices();
  }

  removeHolding(id: string): void {
    this.assetService.removeHolding(id);
  }

  isCryptoHolding(h: Holding): h is CryptoHolding {
    return h.type === 'crypto';
  }
}
