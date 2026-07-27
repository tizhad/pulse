import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  model,
  OnDestroy,
  signal,
  ViewEncapsulation,
  viewChild,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  templateUrl: './rich-editor.component.html',
  styleUrl: './rich-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class RichEditorComponent implements OnDestroy {
  readonly value = model<string>('');

  private readonly hostRef = viewChild<ElementRef<HTMLDivElement>>('editorHost');
  private readonly linkInputRef = viewChild<ElementRef<HTMLInputElement>>('linkInput');

  private editor: Editor | null = null;

  readonly showLinkInput = signal(false);
  readonly linkUrl = signal('');

  readonly active = signal({
    bold: false,
    italic: false,
    h2: false,
    bulletList: false,
    orderedList: false,
    code: false,
    codeBlock: false,
    link: false,
  });

  constructor() {
    afterNextRender(() => this.initEditor());

    // Sync external value resets (e.g. openForm sets value to '')
    effect(() => {
      const val = this.value();
      if (!this.editor || this.editor.isDestroyed) return;
      const current = this.editor.isEmpty ? '' : this.editor.getHTML();
      if (current !== val) {
        this.editor.commands.setContent(val || '');
      }
    });

    // Move focus into the link input the moment it appears, replacing the
    // native `autofocus` attribute (flagged by @angular-eslint as harmful
    // on page load, but this input only renders after a user action).
    effect(() => {
      if (this.showLinkInput()) {
        this.linkInputRef()?.nativeElement.focus();
      }
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  // ── Toolbar commands ────────────────────────────────────────────────────

  bold(): void {
    this.editor?.chain().focus().toggleBold().run();
  }

  italic(): void {
    this.editor?.chain().focus().toggleItalic().run();
  }

  heading(): void {
    this.editor?.chain().focus().toggleHeading({ level: 2 }).run();
  }

  bulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  orderedList(): void {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  inlineCode(): void {
    this.editor?.chain().focus().toggleCode().run();
  }

  codeBlock(): void {
    this.editor?.chain().focus().toggleCodeBlock().run();
  }

  toggleLinkInput(): void {
    if (this.showLinkInput()) {
      this.closeLinkInput();
      return;
    }
    // Pre-fill if cursor is already on a link
    const href = this.editor?.getAttributes('link')['href'] ?? '';
    this.linkUrl.set(href);
    this.showLinkInput.set(true);
  }

  closeLinkInput(): void {
    this.showLinkInput.set(false);
    this.linkUrl.set('');
    this.editor?.commands.focus();
  }

  insertLink(): void {
    const url = this.linkUrl().trim();
    if (!url) {
      this.editor?.chain().focus().unsetLink().run();
    } else {
      this.editor
        ?.chain()
        .focus()
        .setLink({ href: url, target: '_blank' })
        .run();
    }
    this.showLinkInput.set(false);
    this.linkUrl.set('');
  }

  // ── Init ────────────────────────────────────────────────────────────────

  private initEditor(): void {
    const el = this.hostRef()?.nativeElement;
    if (!el) return;

    this.editor = new Editor({
      element: el,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2] },
          codeBlock: { HTMLAttributes: { class: 're-code-block' } },
        }),
        Link.configure({ openOnClick: false, autolink: true }),
        Placeholder.configure({
          placeholder: 'Add notes, code snippets, links…',
        }),
      ],
      content: this.value() || '',
      editorProps: {
        attributes: { class: 're-content' },
      },
      onUpdate: ({ editor }) => {
        const html = editor.isEmpty ? '' : editor.getHTML();
        this.value.set(html);
      },
      onTransaction: ({ editor }) => {
        this.active.set({
          bold: editor.isActive('bold'),
          italic: editor.isActive('italic'),
          h2: editor.isActive('heading', { level: 2 }),
          bulletList: editor.isActive('bulletList'),
          orderedList: editor.isActive('orderedList'),
          code: editor.isActive('code'),
          codeBlock: editor.isActive('codeBlock'),
          link: editor.isActive('link'),
        });
      },
    });
  }
}
