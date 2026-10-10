const PERIOD_MS = 2000;
const AMPLITUDE = 10;

let lastEnd: "tic" | "tok" | "" = "";

export function pendulum(nowMs: number): {
  angle: number;
  transform: string;
  beat: "tic" | "tok" | "";
} {
  const phase = ((nowMs % PERIOD_MS) + PERIOD_MS) % PERIOD_MS;
  const angle = Math.sin((phase / PERIOD_MS) * Math.PI * 2) * AMPLITUDE;
  const rightEnd = PERIOD_MS / 4;
  const leftEnd = (3 * PERIOD_MS) / 4;
  const nearRight = Math.abs(phase - rightEnd) < 45;
  const nearLeft = Math.abs(phase - leftEnd) < 45;
  let beat: "tic" | "tok" | "" = "";
  if (nearLeft && lastEnd !== "tic") {
    lastEnd = "tic";
    beat = "tic";
  } else if (nearRight && lastEnd !== "tok") {
    lastEnd = "tok";
    beat = "tok";
  } else if (!nearLeft && !nearRight) {
    lastEnd = "";
  }
  return { angle, transform: `rotate(${angle})`, beat };
}
