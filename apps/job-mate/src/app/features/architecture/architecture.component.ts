import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import mermaid from 'mermaid';

@Component({
  selector: 'app-architecture',
  templateUrl: './architecture.component.html',
  styleUrl: './architecture.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchitectureComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);

  readonly content = signal<SafeHtml | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    mermaid.initialize({
      startOnLoad: false,
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'default',
    });

    this.load();
  }

  private async load(): Promise<void> {
    try {
      const res = await fetch('/ARCHITECTURE.md');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const markdown = await res.text();

      // Custom renderer: turns ```mermaid blocks into <pre class="mermaid">
      marked.use({
        renderer: {
          code({ text, lang }) {
            if (lang === 'mermaid') {
              return `<pre class="mermaid">${text}</pre>`;
            }
            return false; // fall through to default code rendering
          },
        },
      });

      const html = String(marked.parse(markdown));
      this.content.set(this.sanitizer.bypassSecurityTrustHtml(html));

      // Let Angular render the [innerHTML] first, then run mermaid
      setTimeout(() => mermaid.run(), 0);
    } catch (e) {
      this.error.set('Could not load ARCHITECTURE.md');
    }
  }
}
