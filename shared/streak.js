/**
 * Consecutive qualifying days ending today — or ending yesterday if today
 * doesn't qualify *yet*. An unfinished morning shouldn't show "0 days".
 *
 * @param {(index: number) => number|undefined} scoreAt  score for a day index (undefined = not logged)
 * @param {number} todayIndex
 * @param {{ minScore?: number, firstIndex?: number }} [opts]
 */
export function calcStreak(scoreAt, todayIndex, { minScore = 3, firstIndex = 0 } = {}) {
  const ok = (i) => (scoreAt(i) ?? -1) >= minScore;
  let i = ok(todayIndex) ? todayIndex : todayIndex - 1;
  let streak = 0;
  while (i >= firstIndex && ok(i)) { streak++; i--; }
  return streak;
}
