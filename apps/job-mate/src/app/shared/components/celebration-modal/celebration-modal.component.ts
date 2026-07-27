import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CelebrationService } from '../../../core/services/celebration.service';

type ConfettiPiece = {
  readonly id: number;
  readonly left: number;
  readonly delay: number;
  readonly duration: number;
  readonly color: string;
  readonly width: number;
  readonly height: number;
  readonly circle: boolean;
};

const CONFETTI_COLORS = ['var(--gold)', 'var(--gold-deep)', 'var(--gold-light)', 'var(--amber)', '#fff4d6'];
const CONFETTI_COUNT = 70;

@Component({
  selector: 'app-celebration-modal',
  templateUrl: './celebration-modal.component.html',
  styleUrl: './celebration-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CelebrationModalComponent {
  private readonly celebrationService = inject(CelebrationService);
  readonly celebration = this.celebrationService.celebration;

  readonly confetti = signal<ConfettiPiece[]>([]);

  constructor() {
    effect(() => {
      if (this.celebration()) {
        this.confetti.set(this.generateConfetti());
      }
    });
  }

  dismiss(): void {
    this.celebrationService.dismiss();
  }

  private generateConfetti(): ConfettiPiece[] {
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
      const circle = Math.random() < 0.35;
      const size = 6 + Math.random() * 8;
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.4 + Math.random() * 1.8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        width: size,
        height: circle ? size : size * 1.8,
        circle,
      };
    });
  }
}
