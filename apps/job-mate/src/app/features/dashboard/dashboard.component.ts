import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StateService } from '../../core/services/state.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class DashboardComponent {
  readonly state = inject(StateService);

  readonly pipelineRows = [
    { label: 'Applied',       key: 'applied',      color: 'var(--pipe-applied)' },
    { label: 'Phone screen',  key: 'phoneScreen',  color: 'var(--pipe-phone)' },
    { label: 'Interviewing',  key: 'interviewing', color: 'var(--pipe-interview)' },
    { label: 'Offer 🎉',      key: 'offer',        color: 'var(--pipe-offer)' },
    { label: 'Rejected',      key: 'rejected',     color: 'var(--pipe-rejected)' },
    { label: 'No reply',      key: 'noReply',      color: 'var(--pipe-noreply)' },
  ] as const;

  getPipelineCount(key: string): number {
    return (this.state.pipelineCounts() as Record<string, number>)[key] ?? 0;
  }

  priorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'offer': 'pipe-offer',
      'interviewing': 'pipe-interview',
      'rejected': 'pipe-rejected',
      'phone-screen': 'pipe-phone',
      'applied': 'pipe-applied',
      'saved': 'pipe-saved',
    };
    return map[status] ?? 'pipe-saved';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      'offer': 'Offer 🎉',
      'interviewing': 'Interviewing',
      'rejected': 'Rejected',
      'phone-screen': 'Phone screen',
      'applied': 'Applied',
      'saved': 'Saved',
    };
    return map[status] ?? status;
  }

  companyInitial(company: string): string {
    return company.charAt(0).toUpperCase();
  }
}
