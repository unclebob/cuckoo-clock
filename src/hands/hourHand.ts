let angle = 0;
let placed = false;
let lastMs = 0;

function clockMs(): number {
  return Date.now();
}

export function hourHand(hour: number): { angle: number; transform: string } {
  const target = (((hour % 12) + 12) % 12) * 30;
  const now = clockMs();
  if (!placed) {
    angle = target;
    placed = true;
    lastMs = now;
    return { angle, transform: `rotate(${angle})` };
  }
  const elapsed = Math.min(0.05, Math.max(0, (now - lastMs) / 1000));
  lastMs = now;
  let sweep = target - angle;
  sweep = ((sweep % 360) + 360) % 360;
  if (sweep > 359.99) {
    sweep = 0;
  }
  const eased = Math.min(sweep, 80 * elapsed);
  const clamped = Math.min(eased, 4);
  if (sweep < 0.05) {
    angle = target;
  } else {
    angle = (angle + clamped) % 360;
  }
  return { angle, transform: `rotate(${angle})` };
}
