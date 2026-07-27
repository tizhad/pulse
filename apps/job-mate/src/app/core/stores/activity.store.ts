import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import type { ActivityDayRow } from '../models/database.types';

const HEATMAP_DAYS = 14;
const WEEKLY_LOOKBACK_DAYS = 7;
// Wider than the heatmap window so a streak longer than 14 days isn't undercounted.
const STREAK_FETCH_DAYS = 90;

export interface HeatmapCell {
  readonly date: string;
  readonly count: number;
  readonly intensity: number;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - n);
  return date;
}

@Injectable({ providedIn: 'root' })
export class ActivityStore {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private readonly _days = signal<ActivityDayRow[]>([]);
  private readonly _loaded = signal(false);

  private readonly countByDate = computed(() => {
    const map = new Map<string, number>();
    for (const day of this._days()) {
      map.set(day.activity_date, day.study_count + day.application_count);
    }
    return map;
  });

  readonly heatmapCells = computed<HeatmapCell[]>(() => {
    const counts = this.countByDate();
    const cells: HeatmapCell[] = [];
    let max = 0;
    for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
      const date = toDateKey(daysAgo(i));
      const count = counts.get(date) ?? 0;
      max = Math.max(max, count);
      cells.push({ date, count, intensity: 0 });
    }
    return cells.map(cell => ({ ...cell, intensity: max === 0 ? 0 : cell.count / max }));
  });

  readonly currentStreak = computed(() => {
    const counts = this.countByDate();
    let streak = 0;
    let cursor = counts.get(toDateKey(daysAgo(0))) ? 0 : 1;
    while (counts.get(toDateKey(daysAgo(cursor)))) {
      streak++;
      cursor++;
    }
    return streak;
  });

  readonly weeklyActivityCount = computed(() => {
    const counts = this.countByDate();
    let total = 0;
    for (let i = 0; i < WEEKLY_LOOKBACK_DAYS; i++) {
      total += counts.get(toDateKey(daysAgo(i))) ?? 0;
    }
    return total;
  });

  constructor() {
    effect(() => {
      if (this.auth.user()) {
        this.load();
      } else {
        this._days.set([]);
        this._loaded.set(false);
      }
    });
  }

  async load(): Promise<void> {
    if (this._loaded()) return;
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const since = toDateKey(daysAgo(STREAK_FETCH_DAYS - 1));
    const { data, error } = await this.supabase.client
      .from('activity_days')
      .select('*')
      .eq('user_id', userId)
      .gte('activity_date', since);

    if (!error && data) {
      this._days.set(data);
      this._loaded.set(true);
    }
  }

  invalidate(): void {
    this._loaded.set(false);
  }
}
