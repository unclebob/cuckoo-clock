import { easter } from "./easter";
import { presidentsDay } from "./presidentsDay";
import { thanksgiving } from "./thanksgiving";

export function holiday(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 12 && day === 25) {
    return "Christmas";
  }
  if (month === 12 && day === 24) {
    return "Christmas Eve";
  }
  if (thanksgiving(year, month, day)) {
    return "Thanksgiving";
  }
  if (presidentsDay(year, month, day)) {
    return "Presidents Day";
  }
  const feast = easter(year);
  if (feast.month === month && feast.day === day) {
    return "Easter";
  }
  return "";
}
