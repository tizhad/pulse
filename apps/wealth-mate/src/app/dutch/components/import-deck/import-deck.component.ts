import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DeckService } from '../../services/deck.service';
import { MediaService } from '../../services/media.service';
import { ApkgParserService, ParsedCard } from '../../services/apkg-parser.service';

interface PreviewRow {
  front: string;
  back: string;
}

@Component({
  selector: 'app-import-deck',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './import-deck.component.html',
  styleUrl: './import-deck.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDeckComponent {
  private deckService = inject(DeckService);
  private mediaService = inject(MediaService);
  private apkgParser = inject(ApkgParserService);
  private router = inject(Router);

  readonly deckName = signal('');
  readonly csvText = signal('');
  readonly skipHeader = signal(false);
  readonly error = signal('');
  readonly loading = signal(false);
  readonly preview = signal<PreviewRow[]>([]);
  readonly totalRows = signal(0);

  private fileFormat: 'csv' | 'json' | 'apkg' = 'csv';
  private jsonText = '';
  private apkgCards: ParsedCard[] = [];
  private apkgMediaFiles = new Map<string, Blob>();
  private apkgModelCss = '';

  async onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set('');

    const name = file.name.toLowerCase();

    if (name.endsWith('.apkg')) {
      this.fileFormat = 'apkg';
      this.loading.set(true);
      try {
        const { deckName, cards, mediaFiles, modelCss } = await this.apkgParser.parse(file);
        this.apkgCards = cards;
        this.apkgMediaFiles = mediaFiles;
        this.apkgModelCss = modelCss;
        this.preview.set(cards.slice(0, 5));
        this.totalRows.set(cards.length);
        if (!this.deckName()) this.deckName.set(deckName);
      } catch (e) {
        this.error.set(
          e instanceof Error ? e.message : 'Failed to read .apkg file.'
        );
      } finally {
        this.loading.set(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (name.endsWith('.json')) {
        this.fileFormat = 'json';
        this.jsonText = text;
        this.csvText.set('');
        try {
          const data = JSON.parse(text);
          const items: PreviewRow[] = Array.isArray(data) ? data : (data.cards ?? []);
          this.preview.set(items.slice(0, 5));
          this.totalRows.set(items.length);
        } catch {
          this.error.set('Invalid JSON file.');
        }
      } else {
        this.fileFormat = 'csv';
        this.csvText.set(text);
        this.refreshPreview(text);
      }
      if (!this.deckName()) {
        this.deckName.set(file.name.replace(/\.[^.]+$/, ''));
      }
    };
    reader.readAsText(file);
  }

  onCsvPaste(value: string): void {
    this.csvText.set(value);
    this.fileFormat = 'csv';
    this.refreshPreview(value);
  }

  onSkipHeaderChange(val: boolean): void {
    this.skipHeader.set(val);
    this.refreshPreview(this.csvText());
  }

  private refreshPreview(csv: string): void {
    const lines = csv.trim().split(/\r?\n/);
    const start = this.skipHeader() ? 1 : 0;
    const rows: PreviewRow[] = [];
    let count = 0;
    for (let i = start; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const front = cols[0]?.trim();
      const back = cols[1]?.trim();
      if (front && back) {
        count++;
        if (rows.length < 5) rows.push({ front, back });
      }
    }
    this.preview.set(rows);
    this.totalRows.set(count);
  }

  import(): void {
    this.error.set('');
    if (!this.deckName().trim()) {
      this.error.set('Please enter a deck name.');
      return;
    }
    try {
      if (this.fileFormat === 'apkg') {
        const deck = this.deckService.importFromCards(this.deckName().trim(), this.apkgCards);

        // Build cardId → HTML map using the IDs assigned by importFromCards
        const htmlMap = new Map<string, { f: string; b: string }>();
        this.apkgCards.forEach((card, i) => {
          const stored = deck.cards[i];
          if (stored && card.frontHtml && card.backHtml) {
            htmlMap.set(stored.id, { f: card.frontHtml, b: card.backHtml });
          }
        });

        // Store images and HTML in IndexedDB fire-and-forget (can be several MB)
        if (this.apkgMediaFiles.size > 0) {
          this.mediaService.storeMedia(deck.id, this.apkgMediaFiles);
        }
        if (htmlMap.size > 0) {
          this.mediaService.storeCardHtml(deck.id, this.apkgModelCss, htmlMap);
        }
      } else if (this.fileFormat === 'json') {
        this.deckService.importFromJson(this.deckName().trim(), this.jsonText);
      } else {
        if (!this.csvText().trim()) {
          this.error.set('Please provide card data.');
          return;
        }
        this.deckService.importFromCsv(
          this.deckName().trim(),
          this.csvText(),
          this.skipHeader()
        );
      }
      this.router.navigate(['/dutch']);
    } catch {
      this.error.set('Import failed. Check the file format and try again.');
    }
  }
}
