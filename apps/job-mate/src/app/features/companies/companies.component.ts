import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StateService } from '../../core/services/state.service';
import { CompanyStatus } from '../../core/models/jobmate.models';

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

  statusClass(status: CompanyStatus): string {
    return `pipe-${status}`;
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
}
