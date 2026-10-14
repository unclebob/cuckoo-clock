import { easeHand, type HandMotion } from "./ease";

const motion: HandMotion = { angle: 0, placed: false, lastMs: 0 };

export function hourHand(hour: number, minute = 0, second = 0): { angle: number; transform: string } {
  const position = hour + minute / 60 + second / 3600;
  return easeHand(motion, (((position % 12) + 12) % 12) * 30, 80, 4);
}
