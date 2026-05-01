export interface Card {
  id: string;
  // Plain text — always present, used for SRS logic and plain-text fallback display
  front: string;
  back: string;
  // SM-2 spaced-repetition fields
  interval: number;
  repetitions: number;
  easeFactor: number;
  dueDate: string;
  createdAt: string;
}
// Note: rich Anki HTML (frontHtml / backHtml) is stored in IndexedDB by MediaService,
// keyed by deckId + cardId. It is NOT on the Card object to avoid blowing localStorage.
