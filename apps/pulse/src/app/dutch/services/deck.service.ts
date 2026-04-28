import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Card } from '../models/card.model';
import { Deck } from '../models/deck.model';
import { MediaService } from './media.service';

@Injectable({ providedIn: 'root' })
export class DeckService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly mediaService = inject(MediaService);
  private readonly STORAGE_KEY = 'pulse_dutch_decks';
  private readonly _decks = signal<Deck[]>([]);

  readonly decks = this._decks.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.load();
    }
  }

  private load(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) this._decks.set(JSON.parse(raw));
  }

  private persist(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._decks()));
    }
  }

  private uid(): string {
    return crypto.randomUUID();
  }

  private createCard(front: string, back: string): Card {
    return {
      id: this.uid(),
      front,
      back,
      interval: 0,
      repetitions: 0,
      easeFactor: 2.5,
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  getDeck(id: string): Deck | undefined {
    return this._decks().find((d) => d.id === id);
  }

  deleteDeck(id: string): void {
    this._decks.update((ds) => ds.filter((d) => d.id !== id));
    this.persist();
    // Clean up IndexedDB blobs for this deck (fire-and-forget)
    this.mediaService.deleteMedia(id);
  }

  updateCard(deckId: string, card: Card): void {
    this._decks.update((ds) =>
      ds.map((d) =>
        d.id === deckId
          ? { ...d, cards: d.cards.map((c) => (c.id === card.id ? card : c)) }
          : d
      )
    );
    this.persist();
  }

  getDueCards(deckId: string): Card[] {
    const deck = this.getDeck(deckId);
    if (!deck) return [];
    const now = new Date();
    return deck.cards.filter(
      (c) => c.repetitions > 0 && new Date(c.dueDate) <= now
    );
  }

  getNewCards(deckId: string): Card[] {
    const deck = this.getDeck(deckId);
    if (!deck) return [];
    return deck.cards.filter((c) => c.repetitions === 0);
  }

  // SM-2 algorithm
  reviewCard(card: Card, rating: 1 | 2 | 3 | 4): Card {
    let { interval, repetitions, easeFactor } = card;

    if (rating === 1) {
      // Again — reset, show again in session
      repetitions = 0;
      interval = 0;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (rating === 2) {
      // Hard — slight interval increase, ease drops
      interval = Math.max(1, Math.ceil(interval * 1.2));
      easeFactor = Math.max(1.3, easeFactor - 0.15);
    } else {
      // Good / Easy
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.ceil(interval * easeFactor);

      if (rating === 4) {
        interval = Math.ceil(interval * 1.3);
        easeFactor = Math.min(2.5, easeFactor + 0.15);
      }
      repetitions++;
    }

    const due = new Date();
    if (interval > 0) due.setDate(due.getDate() + interval);

    return { ...card, interval, repetitions, easeFactor, dueDate: due.toISOString() };
  }

  getNextIntervalText(card: Card, rating: 1 | 2 | 3 | 4): string {
    if (rating === 1) return '< 1 min';
    const { interval } = this.reviewCard(card, rating);
    if (interval === 0) return '< 1 min';
    if (interval === 1) return '1 day';
    return `${interval} days`;
  }

  importFromCards(
    name: string,
    items: Array<{ front: string; back: string }>
  ): Deck {
    const cards = items.map((item) => this.createCard(item.front, item.back));
    const deck: Deck = {
      id: this.uid(),
      name,
      cards,
      createdAt: new Date().toISOString(),
    };
    this._decks.update((ds) => [...ds, deck]);
    this.persist();
    return deck;
  }

  importFromCsv(name: string, csv: string, skipHeader = false): Deck {
    const lines = csv.trim().split(/\r?\n/);
    const start = skipHeader ? 1 : 0;
    const cards: Card[] = [];
    for (let i = start; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      const front = cols[0]?.trim();
      const back = cols[1]?.trim();
      if (front && back) cards.push(this.createCard(front, back));
    }
    const deck: Deck = {
      id: this.uid(),
      name,
      cards,
      createdAt: new Date().toISOString(),
    };
    this._decks.update((ds) => [...ds, deck]);
    this.persist();
    return deck;
  }

  importFromJson(name: string, json: string): Deck {
    const data = JSON.parse(json);
    const items: Array<{ front: string; back: string }> = Array.isArray(data)
      ? data
      : (data.cards ?? []);
    const cards = items
      .filter((item) => item.front && item.back)
      .map((item) => this.createCard(String(item.front), String(item.back)));
    const deck: Deck = {
      id: this.uid(),
      name,
      cards,
      createdAt: new Date().toISOString(),
    };
    this._decks.update((ds) => [...ds, deck]);
    this.persist();
    return deck;
  }

  private parseCsvLine(line: string): string[] {
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cols.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current);
    return cols;
  }
}
