import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import hljs from 'highlight.js';
import { Router } from '@angular/router';
import { SettingsStore } from '../../core/stores/settings.store';
import { AuthService } from '../../core/services/auth.service';
import { CodeThemeService, CODE_THEMES } from '../../core/services/code-theme.service';
import { ResumeParserService } from '../../core/services/resume-parser.service';
import type { UserSettings } from '../../core/models/jobmate.models';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  readonly settingsStore = inject(SettingsStore);
  readonly auth = inject(AuthService);
  readonly codeTheme = inject(CodeThemeService);
  private readonly router = inject(Router);
  private readonly resumeParser = inject(ResumeParserService);

  readonly resumeText = signal('');
  readonly resumeSaving = signal(false);

  readonly codeThemes = CODE_THEMES;

  readonly highlightedSample = hljs.highlight(
`// Score: 1 (new) → 5 (mastered)
function schedule(score: number): Date {
  const days = [1, 3, 7, 14, 30];
  const label = score === 5 ? "mastered" : "reviewing";
  const next = new Date();
  next.setDate(next.getDate() + days[score - 1]);
  return next;
}`, { language: 'typescript' }).value;

  readonly displayName = signal(this.settingsStore.settings()?.displayName ?? '');

  readonly accents: { key: UserSettings['accent']; label: string; color: string }[] = [
    { key: 'indigo', label: 'Indigo', color: '#6C5CE7' },
    { key: 'coral',  label: 'Coral',  color: '#FF7B54' },
    { key: 'mint',   label: 'Mint',   color: '#00BFA5' },
  ];

  async saveDisplayName(): Promise<void> {
    await this.settingsStore.upsert({ displayName: this.displayName() ?? null });
  }

  async setAccent(key: UserSettings['accent']): Promise<void> {
    await this.settingsStore.upsert({ accent: key });
  }

  initial(): string {
    const name = this.settingsStore.settings()?.displayName ?? this.auth.user()?.email ?? '?';
    return name.charAt(0).toUpperCase();
  }

  async saveResume(): Promise<void> {
    const text = this.resumeText().trim();
    if (!text) return;
    this.resumeSaving.set(true);
    const parsed = this.resumeParser.parse(text);
    await this.settingsStore.upsert({ resume: parsed });
    this.resumeText.set('');
    this.resumeSaving.set(false);
  }

  async clearResume(): Promise<void> {
    await this.settingsStore.upsert({ resume: null });
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/auth']);
  }
}
