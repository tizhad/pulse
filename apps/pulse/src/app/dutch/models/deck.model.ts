import { Card } from './card.model';

export interface Deck {
  id: string;
  name: string;
  description?: string;
  cards: Card[];
  createdAt: string;
}
