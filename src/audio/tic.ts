import { audioContext, resumeContext, startVoice, stopVoice, type Voice } from "./player";

let buffer: AudioBuffer | null = null;
const voice: Voice = { source: null, gain: null };

function click(): AudioBuffer {
  const current = audioContext();
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
  resumeContext(audioContext());
}

export function loadTic(): void {
  if (!buffer) {
    buffer = click();
  }
}

export function playTic(): void {
  const current = audioContext();
  if (current.state !== "running") {
    return;
  }
  loadTic();
  stopTic();
  startVoice(current, voice, buffer, 0.16, 0.003, 0.022);
}

export function stopTic(): void {
  stopVoice(voice);
}
