import { describe, it, expect } from 'vitest';
import { calcStreak } from './streak.js';

const from = (scores) => (i) => scores[i];

describe('calcStreak', () => {
  it('counts back from today when today qualifies', () => {
    expect(calcStreak(from([3, 4, 5]), 2)).toBe(3);
  });

  it("doesn't reset because today isn't finished yet", () => {
    expect(calcStreak(from([3, 4, 1]), 2)).toBe(2);
    expect(calcStreak(from([3, 4]), 2)).toBe(2); // today not logged at all
  });

  it('breaks on a gap or a low day', () => {
    expect(calcStreak(from([5, undefined, 4, 4]), 3)).toBe(2);
    expect(calcStreak(from([5, 2, 4, 4]), 3)).toBe(2);
  });

  it('is 0 when yesterday also missed', () => {
    expect(calcStreak(from([5, 1, 1]), 2)).toBe(0);
  });

  it('stops at firstIndex and handles day 0 / before start', () => {
    expect(calcStreak(from([4]), 0)).toBe(1);
    expect(calcStreak(from([]), 0)).toBe(0);
    expect(calcStreak(from([]), -3)).toBe(0);
  });
});
