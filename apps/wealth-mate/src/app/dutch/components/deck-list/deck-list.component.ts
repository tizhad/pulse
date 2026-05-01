import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DeckService } from '../../services/deck.service';
import { Deck } from '../../models/deck.model';

@Component({
  selector: 'app-deck-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './deck-list.component.html',
  styleUrl: './deck-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckListComponent {
  private deckService = inject(DeckService);
  private router = inject(Router);

  readonly decks = this.deckService.decks;

  dueCount(deck: Deck): number {
    return this.deckService.getDueCards(deck.id).length;
  }

  newCount(deck: Deck): number {
    return this.deckService.getNewCards(deck.id).length;
  }

  studyCount(deck: Deck): number {
    return this.dueCount(deck) + this.newCount(deck);
  }

  study(deck: Deck): void {
    this.router.navigate(['/dutch/study', deck.id]);
  }

  deleteDeck(id: string): void {
    if (confirm('Delete this deck and all its cards?')) {
      this.deckService.deleteDeck(id);
    }
  }
}
