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

function knock(): AudioBuffer {
  const current = audio();
  const seconds = 0.03;
  const length = Math.floor(current.sampleRate * seconds);
  const knockBuffer = current.createBuffer(1, length, current.sampleRate);
  const data = knockBuffer.getChannelData(0);
  const low = 620;
  const body = 310;
  for (let i = 0; i < length; i += 1) {
    const time = i / current.sampleRate;
    const envelope = Math.exp(-time / 0.006);
    const tone = Math.sin(2 * Math.PI * low * time) * 0.7 + Math.sin(2 * Math.PI * body * time) * 0.3;
    data[i] = tone * envelope * 0.5;
  }
  return knockBuffer;
}

export function unlockTok(): void {
  const current = audio();
  if (current.state !== "running") {
    void current.resume();
  }
}

export function loadTok(): void {
  if (!buffer) {
    buffer = knock();
  }
}

export function playTok(): void {
  const current = audio();
  if (current.state !== "running") {
    return;
  }
  loadTok();
  stopTok();
  const next = current.createBufferSource();
  next.buffer = buffer;
  const level = current.createGain();
  const when = current.currentTime;
  level.gain.setValueAtTime(0.0001, when);
  level.gain.exponentialRampToValueAtTime(0.18, when + 0.004);
  level.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
  next.connect(level);
  level.connect(current.destination);
  next.start(when);
  source = next;
  gain = level;
}

export function stopTok(): void {
  if (!source) {
    return;
  }
  try {
    source.stop();
  } catch {
    // The knock has already ended.
  }
  source.disconnect();
  gain?.disconnect();
  source = null;
  gain = null;
}
