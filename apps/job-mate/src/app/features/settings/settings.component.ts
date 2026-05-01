import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../core/services/state.service';
import { UserSettings } from '../../core/models/jobmate.models';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class SettingsComponent {
  readonly state = inject(StateService);

  readonly displayName = signal(this.state.settings().displayName);

  readonly accents: { key: UserSettings['accent']; label: string; color: string }[] = [
    { key: 'indigo', label: 'Indigo', color: '#6C5CE7' },
    { key: 'coral',  label: 'Coral',  color: '#FF7B54' },
    { key: 'mint',   label: 'Mint',   color: '#00BFA5' },
  ];

  saveDisplayName(): void {
    this.state.updateDisplayName(this.displayName());
  }

  setAccent(key: UserSettings['accent']): void {
    this.state.updateAccent(key);
  }

  initial(): string {
    return this.state.settings().displayName.charAt(0).toUpperCase();
  }
}
