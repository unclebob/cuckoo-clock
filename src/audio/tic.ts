let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;

function audio(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

function click(): AudioBuffer {
  const current = audio();
  const seconds = 0.022;
  const length = Math.floor(current.sampleRate * seconds);
  const clickBuffer = current.createBuffer(1, length, current.sampleRate);
  const data = clickBuffer.getChannelData(0);
  const frequency = 2140;
  for (let i = 0; i < length; i += 1) {
    const time = i / current.sampleRate;
    const envelope = Math.exp(-time / 0.0035);
    data[i] = Math.sin(2 * Math.PI * frequency * time) * envelope * 0.45;
  }
  return clickBuffer;
}

export function unlockTic(): void {
  const current = audio();
  if (current.state !== "running") {
    void current.resume();
  }
}

export function loadTic(): void {
  if (!buffer) {
    buffer = click();
  }
}

export function playTic(): void {
  const current = audio();
  if (current.state !== "running") {
    return;
  }
  loadTic();
  stopTic();
  const next = current.createBufferSource();
  next.buffer = buffer;
  const level = current.createGain();
  const when = current.currentTime;
  level.gain.setValueAtTime(0.0001, when);
  level.gain.exponentialRampToValueAtTime(0.16, when + 0.003);
  level.gain.exponentialRampToValueAtTime(0.0001, when + 0.022);
  next.connect(level);
  level.connect(current.destination);
  next.start(when);
  source = next;
  gain = level;
}

export function stopTic(): void {
  if (!source) {
    return;
  }
  try {
    source.stop();
  } catch {
    // The click has already ended.
  }
  source.disconnect();
  gain?.disconnect();
  source = null;
  gain = null;
}
