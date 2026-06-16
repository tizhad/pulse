import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SettingsStore } from '../../core/stores/settings.store';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { ResumeParserService } from '../../core/services/resume-parser.service';
import { PosthogService } from '../../core/services/posthog.service';

@Component({
  selector: 'app-resume',
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumeComponent {
  readonly settingsStore = inject(SettingsStore);
  private readonly auth = inject(AuthService);
  private readonly authModal = inject(AuthModalService);
  private readonly resumeParser = inject(ResumeParserService);
  private readonly posthog = inject(PosthogService);

  readonly resumeText = signal('');
  readonly resumeSaving = signal(false);

  private requireAuth(): boolean {
    if (this.auth.isAuthenticated()) return true;
    this.authModal.open();
    return false;
  }

  async saveResume(): Promise<void> {
    if (!this.requireAuth()) return;
    const text = this.resumeText().trim();
    if (!text) return;
    this.resumeSaving.set(true);
    const parsed = this.resumeParser.parse(text);
    await this.settingsStore.upsert({ resume: parsed });
    this.posthog.capture('resume_uploaded', {
      skills_count: parsed.skills.length,
      experience_count: parsed.experience.length,
    });
    this.resumeText.set('');
    this.resumeSaving.set(false);
  }

  async clearResume(): Promise<void> {
    if (!this.requireAuth()) return;
    await this.settingsStore.upsert({ resume: null });
  }
}
