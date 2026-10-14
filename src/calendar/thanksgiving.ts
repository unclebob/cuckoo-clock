import { nthWeekday } from "./nthWeekday";

export function thanksgiving(year: number, month: number, day: number): boolean {
  return month === 11 && day === nthWeekday(year, 10, 4, 4);
}
