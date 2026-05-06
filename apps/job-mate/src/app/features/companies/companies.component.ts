import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StateService } from '../../core/services/state.service';
import { CompanyStatus } from '../../core/models/jobmate.models';

const AVATAR_PALETTE: ReadonlyArray<{ bg: string; color: string }> = [
  { bg: '#DCF5E7', color: '#1E7A47' },
  { bg: '#EDE3FD', color: '#6B32B8' },
  { bg: '#DAE8FC', color: '#1E5FA8' },
  { bg: '#FDDCDA', color: '#B02B23' },
  { bg: '#DDE4EA', color: '#2C3E50' },
  { bg: '#FDEBD0', color: '#C0621A' },
  { bg: '#E0F7FA', color: '#00838F' },
  { bg: '#FFF3CD', color: '#A07C10' },
];

@Component({
  selector: 'app-companies',
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompaniesComponent {
  readonly state = inject(StateService);

  initial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  avatarBg(name: string): string {
    return AVATAR_PALETTE[this.nameHash(name) % AVATAR_PALETTE.length].bg;
  }

  avatarColor(name: string): string {
    return AVATAR_PALETTE[this.nameHash(name) % AVATAR_PALETTE.length].color;
  }

  statusClass(status: CompanyStatus): string {
    const map: Record<CompanyStatus, string> = {
      saved: 'pipe-saved',
      applied: 'pipe-applied',
      interviewing: 'pipe-interview',
      offer: 'pipe-offer',
      rejected: 'pipe-rejected',
      'no-reply': 'pipe-noreply',
    };
    return map[status];
  }

  statusLabel(status: CompanyStatus): string {
    const map: Record<CompanyStatus, string> = {
      saved: 'Saved',
      applied: 'Applied',
      interviewing: 'Interviewing',
      offer: 'Offer 🎉',
      rejected: 'Rejected',
      'no-reply': 'No reply',
    };
    return map[status];
  }

  private nameHash(name: string): number {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff;
    }
    return h;
  }
}
