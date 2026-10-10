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
import { advance } from "./time/advance";

type ClockTime = { hour: number; minute: number; second: number };

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
    unlockChime();
    unlockCuckoo();
    unlockTic();
    unlockTok();
    soundOn = true;
    hint?.classList.add("hidden");
  };
  scene.svg.addEventListener("pointerdown", unlock);
  document.addEventListener("keydown", unlock);

  void loadChime().catch(() => undefined);
  void loadCuckoo().catch(() => undefined);

  let shown = readClock(new Date());
  strike(shown.hour, shown.minute, shown.second);
  scene.updateWindow(new Date());
  scene.step(performance.now());

  const frame = (nowMs: number): void => {
    const date = new Date();
    const read = readClock(date);
    scene.hourHand.setAttribute("transform", hourHand(read.hour).transform);
    scene.minuteHand.setAttribute("transform", minuteHand(read.minute).transform);
    scene.secondHand.setAttribute("transform", secondHand(read.second).transform);
    const swing = pendulum(nowMs);
    scene.pendulum.setAttribute("transform", swing.transform);
    if (soundOn && swing.beat === "tic") {
      playTic();
    }
    if (soundOn && swing.beat === "tok") {
      playTok();
    }
    scene.step(nowMs);

    if (read.second !== shown.second || read.minute !== shown.minute || read.hour !== shown.hour) {
      const stepped = advance(shown.hour, shown.minute, shown.second);
      shown = sameTime(stepped, read) ? stepped : read;
      scene.updateWindow(date);
      scene.svg.setAttribute(
        "aria-label",
        `Cuckoo clock, ${shown.hour}:${pad(shown.minute)}:${pad(shown.second)}`,
      );
      const decision = strike(shown.hour, shown.minute, shown.second);
      if (decision.chimeCount > 0 || decision.cuckooCount > 0) {
        void perform(scene, decision.chimeCount, decision.cuckooCount);
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
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
  if (cuckooCount > 0) {
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
}

function readClock(date: Date): ClockTime {
  return {
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  };
}

function sameTime(left: ClockTime, right: ClockTime): boolean {
  return left.hour === right.hour && left.minute === right.minute && left.second === right.second;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

start();
