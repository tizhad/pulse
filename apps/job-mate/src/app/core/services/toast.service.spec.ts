import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { vi, afterEach, beforeEach } from 'vitest';
import { ToastService } from './toast.service';

function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), ToastService],
  });
  return TestBed.inject(ToastService);
}

describe('ToastService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no toasts', () => {
    const toast = setup();
    expect(toast.toasts()).toEqual([]);
  });

  it('adds an error toast with the given message', () => {
    const toast = setup();
    toast.error('Save failed');
    expect(toast.toasts()).toHaveLength(1);
    expect(toast.toasts()[0].message).toBe('Save failed');
    expect(toast.toasts()[0].kind).toBe('error');
  });

  it('stacks multiple toasts with unique ids', () => {
    const toast = setup();
    toast.error('one');
    toast.success('two');
    const ids = toast.toasts().map(t => t.id);
    expect(new Set(ids).size).toBe(2);
    expect(toast.toasts().map(t => t.kind)).toEqual(['error', 'success']);
  });

  it('dismisses a toast by id', () => {
    const toast = setup();
    toast.error('one');
    toast.error('two');
    const first = toast.toasts()[0];
    toast.dismiss(first.id);
    expect(toast.toasts()).toHaveLength(1);
    expect(toast.toasts()[0].message).toBe('two');
  });

  it('auto-dismisses after the timeout', () => {
    const toast = setup();
    toast.error('temporary');
    expect(toast.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(5000);
    expect(toast.toasts()).toEqual([]);
  });
});
