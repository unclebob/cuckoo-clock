import phraseUrl from "./westminster.wav?url";

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

export function unlockChime(): void {
  const current = audio();
  if (current.state !== "running") {
    void current.resume();
  }
}

export function loadChime(): Promise<void> {
  if (buffer) {
    return Promise.resolve();
  }
  if (loading) {
    return loading;
  }
  loading = (async () => {
    const current = audio();
    const response = await fetch(phraseUrl);
    if (!response.ok) {
      throw new Error("The Westminster phrase could not be loaded.");
    }
    const bytes = await response.arrayBuffer();
    buffer = await current.decodeAudioData(bytes.slice(0));
  })();
  return loading;
}

export function playChime(count: number): Promise<void> {
  stopChime();
  if (count <= 0) {
    return Promise.resolve();
  }
  if (!buffer) {
    return loadChime()
      .then(() => playChime(count))
      .catch(() => undefined);
  }
  const current = audio();
  if (current.state === "suspended") {
    void current.resume();
  }
  const phrase = buffer.duration;
  const gap = 0.22;
  const startAt = current.currentTime + 0.05;
  for (let repeat = 0; repeat < count; repeat += 1) {
    const when = startAt + repeat * (phrase + gap);
    const source = current.createBufferSource();
    source.buffer = buffer;
    const gain = current.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.7, when + 0.04);
    const releaseAt = Math.max(when + 0.08, when + phrase - 0.16);
    gain.gain.setValueAtTime(0.7, releaseAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + phrase);
    source.connect(gain);
    gain.connect(current.destination);
    source.start(when);
    source.stop(when + phrase + 0.02);
    sources.push(source);
    gains.push(gain);
  }
  const totalMs = (0.05 + count * (phrase + gap)) * 1000;
  return new Promise((resolve) => {
    finish = resolve;
    timer = window.setTimeout(() => {
      finish = null;
      resolve();
    }, totalMs);
  });
}

export function stopChime(): void {
  window.clearTimeout(timer);
  timer = 0;
  for (const source of sources) {
    try {
      source.stop();
    } catch {
      // This phrase has already ended.
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
