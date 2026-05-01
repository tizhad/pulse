import { Injectable } from '@angular/core';

const PREFIX = 'tracker_v1';

@Injectable({ providedIn: 'root' })
export class StorageService {
  load<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(`${PREFIX}:${key}`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      console.error(`Error occurred while loading from storage: ${key}`);
      return null;
    }
  }

  save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value));
    } catch {
      console.error(`Error occurred while saving to storage: ${key}`);
      // Storage quota exceeded or private-browsing restriction — fail silently
    }
  }

  clear(key: string): void {
    try {
      localStorage.removeItem(`${PREFIX}:${key}`);
    } catch {
      console.error(`Error occurred while clearing storage: ${key}`);
      // ignore
    }
  }
}
