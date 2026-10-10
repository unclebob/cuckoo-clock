export function presidentsDay(year: number, month: number, day: number): boolean {
  if (month !== 2) {
    return false;
  }
  const februaryFirst = new Date(year, 1, 1);
  const weekday = februaryFirst.getDay();
  const daysUntilMonday = (1 - weekday + 7) % 7;
  const thirdMonday = 1 + daysUntilMonday + 14;
  return day === thirdMonday;
}
