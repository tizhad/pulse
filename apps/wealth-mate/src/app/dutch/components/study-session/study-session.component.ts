import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DeckService } from '../../services/deck.service';
import { MediaService } from '../../services/media.service';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-study-session',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './study-session.component.html',
  styleUrl: './study-session.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudySessionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deckService = inject(DeckService);
  private mediaService = inject(MediaService);
  private sanitizer = inject(DomSanitizer);

  readonly deckId = this.route.snapshot.params['deckId'] as string;
  readonly deck = computed(() => this.deckService.getDeck(this.deckId));

  readonly queue = signal<Card[]>([]);
  readonly reviewedCount = signal(0);
  readonly isFlipped = signal(false);
  readonly stats = signal({ again: 0, hard: 0, good: 0, easy: 0 });

  // Card HTML loaded from IndexedDB on session start (set empty = no rich content)
  private cardCss = '';
  readonly cardHtmlMap = signal(new Map<string, { f: string; b: string }>());

  // Resolved HTML with object URLs substituted for <img> filenames
  readonly resolvedFrontHtml = signal<SafeHtml>('');
  readonly resolvedBackHtml = signal<SafeHtml>('');

  readonly currentCard = computed(() => this.queue()[0] ?? null);

  // True when the current card has rich Anki HTML stored in IndexedDB
  readonly hasRichContent = computed(() => {
    const card = this.currentCard();
    return card ? this.cardHtmlMap().has(card.id) : false;
  });

  readonly isComplete = computed(
    () => this.queue().length === 0 && this.reviewedCount() > 0
  );
  readonly totalCards = computed(
    () => this.queue().length + this.reviewedCount()
  );
  readonly progress = computed(() => {
    const total = this.totalCards();
    return total > 0 ? Math.round((this.reviewedCount() / total) * 100) : 0;
  });

  constructor() {
    // Resolve image URLs from IndexedDB whenever the current card changes.
    // effect() must run in the constructor to have an Angular injection context.
    effect(() => {
      const card = this.currentCard();
      const map = this.cardHtmlMap();

      if (!card || !map.size) {
        this.resolvedFrontHtml.set('');
        this.resolvedBackHtml.set('');
        return;
      }

      const html = map.get(card.id);
      if (!html) {
        this.resolvedFrontHtml.set('');
        this.resolvedBackHtml.set('');
        return;
      }

      // Prepend the deck's model CSS once per card render
      const css = this.cardCss ? `<style>${this.cardCss}</style>` : '';

      this.mediaService
        .resolveImageSrcs(this.deckId, `${css}${html.f}`)
        .then(resolved =>
          this.resolvedFrontHtml.set(this.sanitizer.bypassSecurityTrustHtml(resolved))
        );

      this.mediaService
        .resolveImageSrcs(this.deckId, `${css}${html.b}`)
        .then(resolved =>
          this.resolvedBackHtml.set(this.sanitizer.bypassSecurityTrustHtml(resolved))
        );
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.deck()) {
      this.router.navigate(['/dutch']);
      return;
    }

    const due = this.deckService.getDueCards(this.deckId);
    const newCards = this.deckService.getNewCards(this.deckId).slice(0, 20);
    this.queue.set([...due, ...newCards]);

    if (this.queue().length === 0) {
      this.router.navigate(['/dutch']);
      return;
    }

    // Load Anki card HTML from IndexedDB (only present for .apkg-imported decks)
    const htmlData = await this.mediaService.fetchCardHtml(this.deckId);
    if (htmlData) {
      this.cardCss = htmlData.css;
      this.cardHtmlMap.set(htmlData.cards);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (this.isComplete()) return;
    if (!this.isFlipped() && (event.code === 'Space' || event.code === 'Enter')) {
      event.preventDefault();
      this.flip();
    } else if (this.isFlipped()) {
      if (event.key === '1') this.rate(1);
      else if (event.key === '2') this.rate(2);
      else if (event.key === '3') this.rate(3);
      else if (event.key === '4') this.rate(4);
    }
  }

  flip(): void {
    this.isFlipped.set(true);
  }

  rate(rating: 1 | 2 | 3 | 4): void {
    const card = this.currentCard();
    if (!card || !this.isFlipped()) return;

    const updated = this.deckService.reviewCard(card, rating);

    this.stats.update((s) => {
      const next = { ...s };
      if (rating === 1) next.again++;
      else if (rating === 2) next.hard++;
      else if (rating === 3) next.good++;
      else next.easy++;
      return next;
    });

    if (rating === 1) {
      // Put back at end of queue — shown again this session
      this.queue.update((q) => [...q.slice(1), updated]);
    } else {
      this.deckService.updateCard(this.deckId, updated);
      this.reviewedCount.update((n) => n + 1);
      this.queue.update((q) => q.slice(1));
    }

    this.isFlipped.set(false);
  }

  nextInterval(rating: 1 | 2 | 3 | 4): string {
    const card = this.currentCard();
    if (!card) return '';
    return this.deckService.getNextIntervalText(card, rating);
  }
}
