import callUrl from "./cuckoo.mp3?url";
import {
  audioContext,
  finishVoices,
  loadClip,
  resumeContext,
  scheduleRepeats,
  stopVoices,
  type Clip,
  type Voices,
} from "./player";

const CALL_SECONDS = 1.05;
const GAP_SECONDS = 0.18;

const clip: Clip = { buffer: null, loading: null };
const voices: Voices = { sources: [], gains: [], timer: 0, finish: null };

export function unlockCuckoo(): void {
  resumeContext(audioContext());
}

export function loadCuckoo(): Promise<void> {
  return loadClip(clip, callUrl, "The cuckoo call could not be loaded.", audioContext());
}

export function playCuckoo(count: number): Promise<void> {
  stopCuckoo();
  if (count <= 0) {
    return Promise.resolve();
  }
  if (!clip.buffer) {
    return loadCuckoo()
      .then(() => playCuckoo(count))
      .catch(
        () =>
          new Promise((resolve) => {
            window.setTimeout(resolve, count * (CALL_SECONDS + GAP_SECONDS) * 1000);
          }),
      );
  }
  const current = audioContext();
  if (current.state === "suspended") {
    void current.resume();
  }
  const call = Math.min(CALL_SECONDS, clip.buffer.duration);
  scheduleRepeats(voices, current, clip.buffer, count, {
    duration: call,
    gap: GAP_SECONDS,
    lead: 0.04,
    peak: 0.62,
    ramp: 0.02,
    hold: 0.06,
    tail: 0.12,
    span: call,
  });
  const totalMs = (0.04 + count * (call + GAP_SECONDS)) * 1000;
  return finishVoices(voices, totalMs);
}

export function stopCuckoo(): void {
  stopVoices(voices);
}
