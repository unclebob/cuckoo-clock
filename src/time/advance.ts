export function advance(
  hour: number,
  minute: number,
  second: number,
): { hour: number; minute: number; second: number } {
  let nextSecond = second + 1;
  let nextMinute = minute;
  let nextHour = hour;
  if (nextSecond >= 60) {
    nextSecond = 0;
    nextMinute += 1;
  }
  if (nextMinute >= 60) {
    nextMinute = 0;
    nextHour += 1;
  }
  if (nextHour >= 24) {
    nextHour = 0;
  }
  return { hour: nextHour, minute: nextMinute, second: nextSecond };
}
