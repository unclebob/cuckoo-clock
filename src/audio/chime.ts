import { audioContext, finishVoices, resumeContext, stopVoices, type Voices } from "./player";
import { loadRod, strikeRod } from "./rod";

const voices: Voices = { sources: [], gains: [], timer: 0, finish: null };

const noteSeconds = 0.72;
const phraseSeconds = 3.52;
const lead = 0.05;
const ring = 2.6;

const gSharp4 = 415.3;
const fSharp4 = 369.99;
const e4 = 329.63;
const b3 = 246.94;

const phrases = [
  [gSharp4, fSharp4, e4, b3],
  [e4, gSharp4, fSharp4, b3],
  [e4, fSharp4, gSharp4, e4],
  [gSharp4, e4, fSharp4, b3],
  [b3, fSharp4, gSharp4, e4],
];

const quarters = [[0], [1, 2], [3, 4, 0], [1, 2, 3, 4]];

export function unlockChime(): void {
  resumeContext(audioContext());
}

export function loadChime(): Promise<void> {
  loadRod(audioContext());
  return Promise.resolve();
}

export function playChime(count: number): Promise<void> {
  stopChime();
  if (count <= 0) {
    return Promise.resolve();
  }
  const current = audioContext();
  if (current.state === "suspended") {
    void current.resume();
  }
  const total = scheduleQuarter(current, count);
  return finishVoices(voices, total * 1000);
}

export function stopChime(): void {
  stopVoices(voices);
}

function scheduleQuarter(context: AudioContext, count: number): number {
  loadRod(context);
  const chosen = quarters[Math.min(count, quarters.length) - 1];
  const origin = context.currentTime + lead;
  let last = 0;
  for (let phrase = 0; phrase < chosen.length; phrase += 1) {
    const notes = phrases[chosen[phrase]];
    for (let note = 0; note < notes.length; note += 1) {
      const at = phrase * phraseSeconds + note * noteSeconds;
      strikeRod(voices, context, notes[note], origin + at);
      last = at;
    }
  }
  return lead + last + ring;
}
