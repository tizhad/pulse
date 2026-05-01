// 1 troy ounce = 31.1035 grams — the standard unit for precious metal spot prices
export const TROY_OZ_IN_GRAMS = 31.1035;

export type GoldKarat = 24 | 22 | 21 | 18 | 14 | 10 | 9;

export interface GoldKaratOption {
  karat: GoldKarat;
  label: string;
  // Fractional gold purity (e.g. 18K = 75% pure = 0.75)
  purity: number;
}

export const GOLD_KARATS: GoldKaratOption[] = [
  { karat: 24, label: '24K (999)', purity: 0.999 },
  { karat: 22, label: '22K (916)', purity: 0.9167 },
  { karat: 21, label: '21K (875)', purity: 0.875 },
  { karat: 18, label: '18K (750)', purity: 0.75 },
  { karat: 14, label: '14K (583)', purity: 0.5833 },
  { karat: 10, label: '10K (417)', purity: 0.4167 },
  { karat: 9,  label: '9K (375)',  purity: 0.375 },
];

export interface GoldHolding {
  id: string;
  type: 'gold';
  karat: GoldKarat;
  grams: number;
  // Where the asset is held — e.g. "Physical (safe)", "Bank vault", "Jewellery"
  description?: string;
  addedAt: string;
}

export interface CryptoHolding {
  id: string;
  type: 'crypto';
  coinId: string;      // CoinGecko ID (e.g. "bitcoin")
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  amount: number;
  // Where the asset is held — e.g. "Binance", "Ledger hardware wallet", "Coinbase"
  description?: string;
  addedAt: string;
}

export type Holding = GoldHolding | CryptoHolding;

// Shape returned by CoinGecko /coins/markets endpoint.
// Fields price_change_percentage_7d_in_currency and _30d_ are only present
// when the query param price_change_percentage=7d,30d is included.
export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  price_change_percentage_30d_in_currency: number;
  market_cap: number;
  market_cap_rank: number;
}
