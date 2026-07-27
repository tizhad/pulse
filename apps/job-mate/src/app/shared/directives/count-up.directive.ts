import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';

const DURATION_MS = 900;

/**
 * Animates the host element's text from 0 to the target number the first
 * time it scrolls into view. The template should contain the final value
 * as static text so SSR/prerender and reduced-motion users see it as-is.
 */
@Directive({ selector: '[appCountUp]' })
export class CountUpDirective {
  readonly appCountUp = input.required<number>();
  readonly countUpPrefix = input('');
  readonly countUpSuffix = input('');

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.observe());
  }

  private observe(): void {
    const element = this.el.nativeElement;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.disconnect();
            this.animate(element);
          }
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private animate(element: HTMLElement): void {
    const target = this.appCountUp();
    const prefix = this.countUpPrefix();
    const suffix = this.countUpSuffix();
    const start = performance.now();
    let frame = 0;

    const tick = (now: number): void => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    this.destroyRef.onDestroy(() => cancelAnimationFrame(frame));
  }
}
