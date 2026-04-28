import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import JSZip from 'jszip';

export interface ParsedCard {
  front: string;
  back: string;
  // Rich HTML with original <img> filenames intact — resolved to object URLs at display time
  frontHtml?: string;
  backHtml?: string;
}

export interface ParsedApkg {
  deckName: string;
  cards: ParsedCard[];
  // Image blobs keyed by original filename (e.g. "image0.jpg")
  mediaFiles: Map<string, Blob>;
  // Model CSS — stored once per deck in IndexedDB, NOT repeated per card
  modelCss: string;
}

// Represents one Anki note model (a note type with named fields and card templates)
interface AnkiModel {
  name: string;
  // Ordered list of field names matching the \x1f-separated flds column in notes
  fieldNames: string[];
  templates: AnkiTemplate[];
  // Raw CSS from the model — injected into rendered rich HTML so cards look like Anki
  css: string;
}

// A single card template inside a model (Anki can have multiple per model, e.g. Forward + Reverse)
interface AnkiTemplate {
  name: string;
  // qfmt = question (front) template; afmt = answer (back) template
  qfmt: string;
  afmt: string;
}

// Map from model ID (string) to its parsed model definition
type ModelMap = Record<string, AnkiModel>;

@Injectable({ providedIn: 'root' })
export class ApkgParserService {
  private readonly platformId = inject(PLATFORM_ID);

  async parse(file: File): Promise<ParsedApkg> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('APKG parsing is only supported in the browser.');
    }

    // .apkg is a ZIP archive — unzip it first
    const zip = await JSZip.loadAsync(file);

    // Newer Anki writes collection.anki21; older versions write collection.anki2
    const dbEntry =
      zip.file('collection.anki21') ??
      zip.file('collection.anki2') ??
      zip.file('collection.anki21b');

    if (!dbEntry) {
      throw new Error(
        'Invalid .apkg file: no Anki collection database found inside the archive.'
      );
    }

    // Lazy-load sql.js so the ~1.5 MB WASM is only fetched when the user selects an .apkg
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sqlJsModule = (await import('sql.js')) as any;
    const initSqlJs = sqlJsModule.default ?? sqlJsModule;
    const SQL = await initSqlJs({ locateFile: () => '/assets/sql-wasm.wasm' });

    const dbBuffer = await dbEntry.async('arraybuffer');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = new SQL.Database(new Uint8Array(dbBuffer));

    // Extract image blobs in parallel with the DB reads (zip is already in memory)
    const mediaFiles = await this.extractMedia(zip);

    const deckName = this.extractDeckName(db);
    const models = this.extractModels(db);
    const modelCss = this.extractModelCss(models);
    const cards = this.extractCards(db, models);

    db.close();
    return { deckName, cards, mediaFiles, modelCss };
  }

  // --- Deck name ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractDeckName(db: any): string {
    try {
      const result = db.exec('SELECT decks FROM col LIMIT 1');
      if (!result.length) return 'Imported Deck';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decksJson = JSON.parse(result[0].values[0][0] as string) as Record<string, any>;

      // Skip the built-in Default deck (always id=1)
      const candidates = Object.values(decksJson).filter(
        (d) => String(d.id) !== '1' && d.name !== 'Default'
      );

      if (candidates.length > 0) {
        const fullName: string = candidates[0].name;
        // Anki nests decks with "::" (e.g. "Language::Dutch") — take the last segment
        return fullName.split('::').at(-1) ?? fullName;
      }
    } catch {
      // fall through to default
    }
    return 'Imported Deck';
  }

  // --- Model extraction ---

  // Reads the `models` JSON blob from the col table and builds a ModelMap.
  // Models define field names and the Mustache-like card templates used to render cards.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractModels(db: any): ModelMap {
    const map: ModelMap = {};
    try {
      const result = db.exec('SELECT models FROM col LIMIT 1');
      if (!result.length) return map;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = JSON.parse(result[0].values[0][0] as string) as Record<string, any>;

      for (const [mid, m] of Object.entries(raw)) {
        map[mid] = {
          name: m.name,
          css: (m.css as string) ?? '',
          // flds is an ordered array of field descriptor objects; we only need the name
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fieldNames: (m.flds as any[]).map((f) => f.name as string),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          templates: (m.tmpls as any[]).map((t) => ({
            name: t.name as string,
            qfmt: t.qfmt as string,
            afmt: t.afmt as string,
          })),
        };
      }
    } catch {
      // return whatever was collected
    }
    return map;
  }

  // --- Card extraction ---

  // For each note, look up its model, then render each template into a front/back pair.
  // This mirrors what Anki itself does: substitute {{FieldName}} placeholders with
  // the note's actual field values and strip media/HTML.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractCards(db: any, models: ModelMap): ParsedCard[] {
    const cards: ParsedCard[] = [];
    try {
      // mid = model ID — tells us which field names and templates apply to this note
      const result = db.exec('SELECT flds, mid FROM notes');
      if (!result.length) return cards;

      for (const row of result[0].values as [string, number][]) {
        const [fldsRaw, mid] = row;
        const model = models[String(mid)];
        if (!model) continue;

        // Build a name→value map for this note's fields
        const rawFields = fldsRaw.split('\x1f');
        const fieldMap: Record<string, string> = {};
        model.fieldNames.forEach((name, i) => {
          fieldMap[name] = rawFields[i] ?? '';
        });

        // Each template in the model produces a separate card (e.g. Forward + Reverse).
        // We render both front and back by substituting {{FieldName}} tokens.
        for (const tmpl of model.templates) {
          const front = this.renderTemplate(tmpl.qfmt, fieldMap);

          // The back template uses {{FrontSide}} to re-embed the front.
          // We remove it so the back only contains the answer portion.
          const backTmplAnswerOnly = tmpl.afmt
            .replace(/\{\{FrontSide\}\}/gi, '')
            // Also strip the answer-separator hr Anki injects
            .replace(/<hr[^>]*id=["']?answer["']?[^>]*>/gi, '')
            .trim();
          const back = this.renderTemplate(backTmplAnswerOnly, fieldMap);

          if (front && back) {
            // Rich HTML preserves <img> tags; CSS is stored separately (once per deck)
            // and injected at display time to avoid repeating kilobytes of CSS per card.
            const frontHtml = `<div class="card">${this.renderRichTemplate(tmpl.qfmt, fieldMap)}</div>`;
            const backHtml = `<div class="card">${this.renderRichTemplate(backTmplAnswerOnly, fieldMap)}</div>`;
            cards.push({ front, back, frontHtml, backHtml });
          }
        }
      }
    } catch {
      // return whatever was collected so far
    }
    return cards;
  }

  // Returns the CSS from the first (primary) model — stored once per deck in IndexedDB
  // rather than repeated inside every card's HTML to keep storage sizes sane.
  private extractModelCss(models: ModelMap): string {
    const first = Object.values(models)[0];
    return first?.css ?? '';
  }

  // --- Media extraction ---

  // Reads the `media` JSON from the zip and extracts each image file as a Blob.
  // Anki stores media as numbered files (0, 1, 2, ...) with a `media` manifest
  // that maps number → original filename; we restore the original names here.
  private async extractMedia(zip: JSZip): Promise<Map<string, Blob>> {
    const result = new Map<string, Blob>();
    const mediaEntry = zip.file('media');
    if (!mediaEntry) return result;

    try {
      const mediaJson = await mediaEntry.async('string');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mediaMap: Record<string, string> = JSON.parse(mediaJson) as any;
      const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|svg|avif)$/i;

      for (const [numericKey, filename] of Object.entries(mediaMap)) {
        if (!IMAGE_EXTS.test(filename)) continue;
        const entry = zip.file(numericKey);
        if (!entry) continue;

        const buffer = await entry.async('arraybuffer');
        const ext = filename.split('.').pop()?.toLowerCase() ?? '';
        const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        result.set(filename, new Blob([buffer], { type: mimeType }));
      }
    } catch {
      // return whatever was collected
    }
    return result;
  }

  // --- Template rendering ---

  // Replaces {{FieldName}} tokens with field values, then strips all HTML and media,
  // producing plain readable text suitable for a flashcard.
  private renderTemplate(template: string, fields: Record<string, string>): string {
    let rendered = template;

    // Handle conditional blocks: {{#Field}}...{{/Field}} — render only if field is non-empty
    rendered = rendered.replace(
      /\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
      (_, fieldName, content) => (fields[fieldName.trim()] ? content : '')
    );

    // Handle negative conditional blocks: {{^Field}}...{{/Field}} — render only if field is empty
    rendered = rendered.replace(
      /\{\{\^([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
      (_, fieldName, content) => (!fields[fieldName.trim()] ? content : '')
    );

    // Substitute {{FieldName}} with its value (unknown fields become empty string)
    rendered = rendered.replace(
      /\{\{([^#^/][^}]*)\}\}/g,
      (_, fieldName) => fields[fieldName.trim()] ?? ''
    );

    return this.clean(rendered);
  }

  // Like renderTemplate but keeps the full HTML structure intact — <img> tags are
  // preserved with their original filenames so MediaService can resolve them later.
  // Only Anki [sound:...] media tags are stripped (audio not supported in this app).
  private renderRichTemplate(template: string, fields: Record<string, string>): string {
    let rendered = template;

    rendered = rendered.replace(
      /\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
      (_, fieldName, content) => (fields[fieldName.trim()] ? content : '')
    );
    rendered = rendered.replace(
      /\{\{\^([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
      (_, fieldName, content) => (!fields[fieldName.trim()] ? content : '')
    );
    rendered = rendered.replace(
      /\{\{([^#^/][^}]*)\}\}/g,
      (_, fieldName) => fields[fieldName.trim()] ?? ''
    );

    return rendered.replace(/\[sound:[^\]]+\]/g, '').trim();
  }

  // --- Text cleaning ---

  // Strips HTML tags and Anki-specific media tags, normalises whitespace.
  // Called on each rendered template so the stored card text is plain and readable.
  private clean(html: string): string {
    return html
      .replace(/\[sound:[^\]]+\]/g, '')      // remove Anki [sound:file.mp3] tags
      .replace(/<br\s*\/?>/gi, ' ')           // convert <br> to space (not newline, better for cards)
      .replace(/<[^>]+>/g, ' ')              // strip all remaining HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')                  // collapse multiple spaces/newlines
      .trim();
  }
}
