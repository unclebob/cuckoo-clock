import { easeHand, type HandMotion } from "./ease";

const motion: HandMotion = { angle: 0, placed: false, lastMs: 0 };

export function minuteHand(minute: number, second = 0): { angle: number; transform: string } {
  const position = minute + second / 60;
  return easeHand(motion, (((position % 60) + 60) % 60) * 6, 36, 2);
}
