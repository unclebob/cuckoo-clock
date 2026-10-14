export type HandMotion = {
  angle: number;
  placed: boolean;
  lastMs: number;
};

export function easeHand(
  motion: HandMotion,
  target: number,
  rate: number,
  limit: number,
): { angle: number; transform: string } {
  const now = Date.now();
  if (!motion.placed) {
    motion.angle = target;
    motion.placed = true;
    motion.lastMs = now;
    return { angle: motion.angle, transform: `rotate(${motion.angle})` };
  }
  const elapsed = Math.min(0.05, Math.max(0, (now - motion.lastMs) / 1000));
  motion.lastMs = now;
  let sweep = target - motion.angle;
  sweep = ((sweep % 360) + 360) % 360;
  if (sweep > 359.99) {
    sweep = 0;
  }
  const eased = Math.min(sweep, rate * elapsed);
  const clamped = Math.min(eased, limit);
  if (sweep < 0.05) {
    motion.angle = target;
  } else {
    motion.angle = (motion.angle + clamped) % 360;
  }
  return { angle: motion.angle, transform: `rotate(${motion.angle})` };
}
