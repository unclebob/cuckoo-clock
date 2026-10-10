export function thanksgiving(year: number, month: number, day: number): boolean {
  if (month !== 11) {
    return false;
  }
  const novemberFirst = new Date(year, 10, 1);
  const weekday = novemberFirst.getDay();
  const daysUntilThursday = (4 - weekday + 7) % 7;
  const fourthThursday = 1 + daysUntilThursday + 21;
  return day === fourthThursday;
}
