import { audioContext, resumeContext, startVoice, stopVoice, type Voice } from "./player";

let buffer: AudioBuffer | null = null;
const voice: Voice = { source: null, gain: null };

function knock(): AudioBuffer {
  const current = audioContext();
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
  resumeContext(audioContext());
}

export function loadTok(): void {
  if (!buffer) {
    buffer = knock();
  }
}

export function playTok(): void {
  const current = audioContext();
  if (current.state !== "running") {
    return;
  }
  loadTok();
  stopTok();
  startVoice(current, voice, buffer, 0.18, 0.004, 0.03);
}

export function stopTok(): void {
  stopVoice(voice);
}
