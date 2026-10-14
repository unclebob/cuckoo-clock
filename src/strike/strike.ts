let pageOpen = false;
let heldBoundary = "";

function cuckoosForHour(hour: number): number {
  const hourOnDial = ((hour % 12) + 12) % 12;
  if (hourOnDial === 0) {
    return 12;
  }
  return hourOnDial;
}

function onQuarterBoundary(minute: number, second: number): boolean {
  return second === 0 && (minute === 0 || minute === 15 || minute === 30 || minute === 45);
}

export function strike(
  hour: number,
  minute: number,
  second: number,
): { chimeCount: number; cuckooCount: number } {
  const boundary = onQuarterBoundary(minute, second);
  const boundaryKey = `${hour}:${minute}`;
  if (!pageOpen) {
    pageOpen = true;
    heldBoundary = boundary ? boundaryKey : "";
    return { chimeCount: 0, cuckooCount: 0 };
  }
  if (!boundary) {
    heldBoundary = "";
    return { chimeCount: 0, cuckooCount: 0 };
  }
  if (heldBoundary === boundaryKey) {
    return { chimeCount: 0, cuckooCount: 0 };
  }
  heldBoundary = boundaryKey;
  if (minute === 15) {
    return { chimeCount: 1, cuckooCount: 0 };
  }
  if (minute === 30) {
    return { chimeCount: 2, cuckooCount: 0 };
  }
  if (minute === 45) {
    return { chimeCount: 3, cuckooCount: 0 };
  }
  return { chimeCount: 4, cuckooCount: cuckoosForHour(hour) };
}
