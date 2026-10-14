export function nthWeekday(year: number, monthIndex: number, weekday: number, nth: number): number {
  const first = new Date(year, monthIndex, 1);
  const daysUntil = (weekday - first.getDay() + 7) % 7;
  return 1 + daysUntil + 7 * (nth - 1);
}
