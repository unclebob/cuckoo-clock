export type ClockTime = { hour: number; minute: number; second: number };

export function sameTime(left: ClockTime, right: ClockTime): boolean {
  return left.hour === right.hour && left.minute === right.minute && left.second === right.second;
}

export function clockMoved(shown: ClockTime, read: ClockTime): boolean {
  return !sameTime(shown, read);
}

export function steppedOrRead(shown: ClockTime, read: ClockTime): ClockTime {
  const stepped = advance(shown.hour, shown.minute, shown.second);
  return sameTime(stepped, read) ? stepped : read;
}

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
