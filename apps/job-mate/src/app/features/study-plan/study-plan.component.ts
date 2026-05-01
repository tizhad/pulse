import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { TrackerStateService } from '../../core/services/tracker-state.service';
import { ProgressService } from '../../core/services/progress.service';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { TaskItemComponent } from '../../shared/components/task-item/task-item.component';

@Component({
  selector: 'app-study-plan',
  templateUrl: './study-plan.component.html',
  styleUrl: './study-plan.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProgressBarComponent, TaskItemComponent],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('200ms ease', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('200ms ease', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
})
export class StudyPlanComponent {
  private readonly state = inject(TrackerStateService);
  private readonly progress = inject(ProgressService);

  readonly weeks = this.state.weeks;

  // All weeks start expanded
  private readonly expandedWeekIds = signal<Set<string>>(
    new Set(this.state.weeks().map((w) => w.id)),
  );

  // Map of weekId → percent for O(1) lookup in template
  readonly weekPercentMap = computed(
    () =>
      new Map(
        this.progress
          .weekPercents()
          .map(({ weekId, percent }) => [weekId, percent]),
      ),
  );

  isExpanded(weekId: string): boolean {
    return this.expandedWeekIds().has(weekId);
  }

  // In toggleWeek, creating a new Set ensures reactivity without
  // mutating the original. Sets don't preserve order,
  // but here order isn't needed. If order mattered, an array with
  // indexOf could work, but Set is better for this use case

  toggleWeek(weekId: string): void {
    this.expandedWeekIds.update((ids) => {
      const newIDs = new Set(ids);
      if (newIDs.has(weekId)) {
        newIDs.delete(weekId);
      } else {
        newIDs.add(weekId);
      }
      return newIDs;
    });
  }

  onToggle(weekId: string, taskId: string): void {
    this.state.toggleTask(weekId, taskId);
  }

  weekPercent(weekId: string): number {
    return this.weekPercentMap().get(weekId) ?? 0;
  }

  doneCount(weekId: string): number {
    return (
      this.weeks()
        .find((w) => w.id === weekId)
        ?.tasks.filter((t) => t.done).length ?? 0
    );
  }
}
