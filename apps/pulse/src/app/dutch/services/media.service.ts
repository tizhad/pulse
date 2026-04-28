import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Stores image blobs extracted from .apkg files in IndexedDB.
// localStorage is limited to ~5 MB; a single Anki deck with images can be 100 MB+,
// so IndexedDB is the only viable option for persisting media across sessions.
@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly DB_NAME = 'pulse_media_v1';
  private readonly STORE_NAME = 'blobs';

  // Lazily opened — avoids blocking app startup with an unnecessary DB open
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(this.DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(this.STORE_NAME);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  }

  // --- Write ---

  // Bulk-stores all image blobs for a deck after .apkg import.
  // Keys are scoped by deckId so multiple decks can coexist without collisions.
  async storeMedia(deckId: string, files: Map<string, Blob>): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || files.size === 0) return;
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      for (const [filename, blob] of files) {
        store.put(blob, `${deckId}:${filename}`);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Read ---

  // Replaces every <img src="filename"> in the given HTML with a temporary
  // object URL backed by the blob stored in IndexedDB.
  // Only replaces relative filenames (skips data: and http: URLs).
  async resolveImageSrcs(deckId: string, html: string): Promise<string> {
    if (!isPlatformBrowser(this.platformId) || !html) return html;

    // Match src="filename" — only relative filenames, not data: or http(s): URLs
    const matches = [
      ...html.matchAll(/<img[^>]+src=["']([^"':/][^"']*)["']/gi),
    ];
    if (!matches.length) return html;

    const db = await this.openDb();
    let resolved = html;

    for (const match of matches) {
      const filename = match[1];
      const url = await this.fetchObjectUrl(db, deckId, filename);
      if (url) {
        resolved = resolved.replace(
          // Escape special regex chars in the filename before building the pattern
          new RegExp(`src=["']${this.escapeRegex(filename)}["']`, 'g'),
          `src="${url}"`
        );
      }
    }
    return resolved;
  }

  // Stores all rendered card HTML for a deck as a single JSON blob in IndexedDB.
  // HTML is too large for localStorage (6k cards × CSS × 2 sides can be 25+ MB),
  // so we keep it here alongside images and load it once per study session.
  async storeCardHtml(
    deckId: string,
    modelCss: string,
    htmlMap: Map<string, { f: string; b: string }>
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || htmlMap.size === 0) return;
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        css: modelCss,
        cards: Object.fromEntries(htmlMap),
      });
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      tx.objectStore(this.STORE_NAME).put(
        new Blob([payload], { type: 'application/json' }),
        `${deckId}:card_html`
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Retrieves the stored card HTML map. Returns null if the deck has no rich HTML
  // (i.e. it was imported from CSV/JSON rather than .apkg).
  async fetchCardHtml(
    deckId: string
  ): Promise<{ css: string; cards: Map<string, { f: string; b: string }> } | null> {
    if (!isPlatformBrowser(this.platformId)) return null;
    const db = await this.openDb();
    return new Promise((resolve) => {
      const req = db
        .transaction(this.STORE_NAME, 'readonly')
        .objectStore(this.STORE_NAME)
        .get(`${deckId}:card_html`);
      req.onsuccess = async () => {
        const blob = req.result;
        if (!(blob instanceof Blob)) { resolve(null); return; }
        try {
          const raw = JSON.parse(await blob.text()) as {
            css: string;
            cards: Record<string, { f: string; b: string }>;
          };
          resolve({ css: raw.css, cards: new Map(Object.entries(raw.cards)) });
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  }

  // --- Delete ---

  // Removes all media blobs for a deck (called when the deck itself is deleted).
  async deleteMedia(deckId: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const db = await this.openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const prefix = `${deckId}:`;
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        if (String(cursor.key).startsWith(prefix)) cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
    });
  }

  // --- Helpers ---

  private async fetchObjectUrl(
    db: IDBDatabase,
    deckId: string,
    filename: string
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const req = db
        .transaction(this.STORE_NAME, 'readonly')
        .objectStore(this.STORE_NAME)
        .get(`${deckId}:${filename}`);
      req.onsuccess = () =>
        resolve(req.result instanceof Blob ? URL.createObjectURL(req.result) : null);
      req.onerror = () => resolve(null);
    });
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
