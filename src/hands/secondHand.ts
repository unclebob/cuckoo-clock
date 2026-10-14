import { easeHand, type HandMotion } from "./ease";

const motion: HandMotion = { angle: 0, placed: false, lastMs: 0 };

export function secondHand(second: number): { angle: number; transform: string } {
  return easeHand(motion, (((second % 60) + 60) % 60) * 6, 360, 6);
}
