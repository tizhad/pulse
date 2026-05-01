import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { StateService } from '../../core/services/state.service';
import { SubjectStatus } from '../../core/models/jobmate.models';

type SortKey = 'potential' | 'name' | 'qaCount';

@Component({
  selector: 'app-subjects',
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class SubjectsComponent {
  readonly state = inject(StateService);

  readonly sortKey = signal<SortKey>('potential');

  setSort(key: SortKey): void {
    this.sortKey.set(key);
  }

  statusClass(status: SubjectStatus): string {
    return `status-${status}`;
  }

  statusLabel(status: SubjectStatus): string {
    const map: Record<SubjectStatus, string> = {
      'in-progress': 'IN PROGRESS',
      done: 'DONE',
      'to-do': 'TO-DO',
    };
    return map[status];
  }

  priorityClass(priority: string): string {
    return `priority-${priority}`;
  }
}
