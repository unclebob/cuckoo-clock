import "./style.css";
import { loadChime, playChime, stopChime, unlockChime } from "./audio/chime";
import { loadCuckoo, playCuckoo, stopCuckoo, unlockCuckoo } from "./audio/cuckoo";
import { playTic, unlockTic } from "./audio/tic";
import { playTok, unlockTok } from "./audio/tok";
import { drawDial } from "./face/dial";
import { hourHand } from "./hands/hourHand";
import { minuteHand } from "./hands/minuteHand";
import { secondHand } from "./hands/secondHand";
import { pendulum } from "./motion/pendulum";
import { strike } from "./strike/strike";
import { clockMoved, steppedOrRead, type ClockTime } from "./time/advance";

let performanceToken = 0;

export function start(): void {
  const host = document.querySelector("#app");
  if (!host) {
    return;
  }
  const scene = drawDial(host);
  const hint = document.querySelector("#hint");
  let soundOn = false;

  const unlock = (): void => {
    soundOn = true;
    armSound(hint);
  };
  scene.svg.addEventListener("pointerdown", unlock);
  document.addEventListener("keydown", unlock);

  void loadChime().catch(() => undefined);
  void loadCuckoo().catch(() => undefined);

  let shown = openClock(scene);
  const frame = (nowMs: number): void => {
    shown = renderFrame(scene, shown, soundOn, nowMs);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function armSound(hint: Element | null): void {
  unlockChime();
  unlockCuckoo();
  unlockTic();
  unlockTok();
  hint?.classList.add("hidden");
}

function openClock(scene: ReturnType<typeof drawDial>): ClockTime {
  const shown = readClock(new Date());
  strike(shown.hour, shown.minute, shown.second);
  scene.updateWindow(new Date());
  scene.step(performance.now());
  return shown;
}

function renderFrame(
  scene: ReturnType<typeof drawDial>,
  shown: ClockTime,
  soundOn: boolean,
  nowMs: number,
): ClockTime {
  const date = new Date();
  const read = readClock(date);
  placeHands(scene, read);
  const swing = pendulum(nowMs);
  scene.pendulum.setAttribute("transform", swing.transform);
  if (soundOn && swing.beat === "tic") {
    playTic();
  }
  if (soundOn && swing.beat === "tok") {
    playTok();
  }
  scene.step(nowMs);
  if (!clockMoved(shown, read)) {
    return shown;
  }
  return publish(scene, shown, read, date);
}

function placeHands(scene: ReturnType<typeof drawDial>, read: ClockTime): void {
  scene.hourHand.setAttribute("transform", hourHand(read.hour, read.minute, read.second).transform);
  scene.minuteHand.setAttribute("transform", minuteHand(read.minute, read.second).transform);
  scene.secondHand.setAttribute("transform", secondHand(read.second).transform);
}

function publish(
  scene: ReturnType<typeof drawDial>,
  shown: ClockTime,
  read: ClockTime,
  date: Date,
): ClockTime {
  const next = steppedOrRead(shown, read);
  scene.updateWindow(date);
  scene.svg.setAttribute(
    "aria-label",
    `Cuckoo clock, ${next.hour}:${pad(next.minute)}:${pad(next.second)}`,
  );
  const decision = strike(next.hour, next.minute, next.second);
  if (decision.chimeCount > 0 || decision.cuckooCount > 0) {
    void perform(scene, decision.chimeCount, decision.cuckooCount);
  }
  return next;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function perform(
  scene: ReturnType<typeof drawDial>,
  chimeCount: number,
  cuckooCount: number,
): Promise<void> {
  const token = ++performanceToken;
  stopChime();
  stopCuckoo();
  scene.setDoors(false);
  scene.setBird("home");
  if (chimeCount > 0) {
    await playChime(chimeCount);
    if (token !== performanceToken) {
      return;
    }
  }
  if (cuckooCount <= 0) {
    return;
  }
  scene.setDoors(true);
  await wait(720);
  if (token !== performanceToken) {
    return;
  }
  scene.setBird("singing");
  await playCuckoo(cuckooCount);
  if (token !== performanceToken) {
    return;
  }
  scene.setBird("out");
  await wait(320);
  if (token !== performanceToken) {
    return;
  }
  scene.setBird("home");
  await wait(560);
  if (token !== performanceToken) {
    return;
  }
  scene.setDoors(false);
}

function readClock(date: Date): ClockTime {
  return {
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

start();
