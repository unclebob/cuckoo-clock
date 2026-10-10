import callUrl from "./cuckoo.mp3?url";

const CALL_SECONDS = 1.05;
const GAP_SECONDS = 0.18;

let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let loading: Promise<void> | null = null;
let sources: AudioBufferSourceNode[] = [];
let gains: GainNode[] = [];
let timer = 0;
let finish: (() => void) | null = null;

function audio(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

export function unlockCuckoo(): void {
  const current = audio();
  if (current.state !== "running") {
    void current.resume();
  }
}

export function loadCuckoo(): Promise<void> {
  if (buffer) {
    return Promise.resolve();
  }
  if (loading) {
    return loading;
  }
  loading = (async () => {
    const current = audio();
    const response = await fetch(callUrl);
    if (!response.ok) {
      throw new Error("The cuckoo call could not be loaded.");
    }
    const bytes = await response.arrayBuffer();
    buffer = await current.decodeAudioData(bytes.slice(0));
  })();
  return loading;
}

export function playCuckoo(count: number): Promise<void> {
  stopCuckoo();
  if (count <= 0) {
    return Promise.resolve();
  }
  if (!buffer) {
    return loadCuckoo()
      .then(() => playCuckoo(count))
      .catch(() => wait(count * (CALL_SECONDS + GAP_SECONDS) * 1000));
  }
  const current = audio();
  if (current.state === "suspended") {
    void current.resume();
  }
  const call = Math.min(CALL_SECONDS, buffer.duration);
  const startAt = current.currentTime + 0.04;
  for (let repeat = 0; repeat < count; repeat += 1) {
    const when = startAt + repeat * (call + GAP_SECONDS);
    const source = current.createBufferSource();
    source.buffer = buffer;
    const gain = current.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.62, when + 0.02);
    const releaseAt = Math.max(when + 0.06, when + call - 0.12);
    gain.gain.setValueAtTime(0.62, releaseAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + call);
    source.connect(gain);
    gain.connect(current.destination);
    source.start(when, 0, call);
    source.stop(when + call + 0.02);
    sources.push(source);
    gains.push(gain);
  }
  const totalMs = (0.04 + count * (call + GAP_SECONDS)) * 1000;
  return new Promise((resolve) => {
    finish = resolve;
    timer = window.setTimeout(() => {
      finish = null;
      resolve();
    }, totalMs);
  });
}

export function stopCuckoo(): void {
  window.clearTimeout(timer);
  timer = 0;
  for (const source of sources) {
    try {
      source.stop();
    } catch {
      // This call has already ended.
    }
    source.disconnect();
  }
  sources = [];
  for (const gain of gains) {
    gain.disconnect();
  }
  gains = [];
  const resolve = finish;
  finish = null;
  resolve?.();
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
