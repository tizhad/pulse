import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { StudyTask, TaskTag } from '../../../core/models/tracker.models';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrl: './task-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskItemComponent {
  readonly task = input.required<StudyTask>();
  readonly toggled = output<void>();

  readonly TaskTag = TaskTag;
}
