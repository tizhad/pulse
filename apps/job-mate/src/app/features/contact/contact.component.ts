import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class ContactComponent {
  readonly name = signal('');
  readonly email = signal('');
  readonly subject = signal('');
  readonly message = signal('');
  readonly sent = signal(false);

  readonly isValid = () =>
    this.name().trim().length > 0 &&
    this.email().trim().length > 0 &&
    this.message().trim().length > 0;

  send(): void {
    if (!this.isValid()) return;
    const body = `Name: ${this.name()}\nEmail: ${this.email()}\n\n${this.message()}`;
    const mailto = `mailto:captain@app.tizhad.com?subject=${encodeURIComponent(this.subject() || 'Grand Line Query')}&body=${encodeURIComponent(body)}`;
    window.open(mailto);
    this.sent.set(true);
    setTimeout(() => this.sent.set(false), 4000);
  }
}
