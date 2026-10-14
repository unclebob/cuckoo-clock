import { nthWeekday } from "./nthWeekday";

export function presidentsDay(year: number, month: number, day: number): boolean {
  return month === 2 && day === nthWeekday(year, 1, 1, 3);
}
