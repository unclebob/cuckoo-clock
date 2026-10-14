import { type Voices } from "./player";

const partials = [
  { ratio: 1, amp: 0.35, decay: 2.6 },
  { ratio: 2.003, amp: 0.21, decay: 1.5 },
  { ratio: 2.76, amp: 0.079, decay: 0.3 },
  { ratio: 2.99, amp: 0.053, decay: 0.45 },
  { ratio: 4.07, amp: 0.088, decay: 0.07 },
];

let hammer: AudioBuffer | null = null;

export function loadRod(context: AudioContext): void {
  if (!hammer) {
    hammer = makeHammer(context);
  }
}

export function strikeRod(voices: Voices, context: AudioContext, frequency: number, when: number): void {
  loadRod(context);
  for (const partial of partials) {
    strikePartial(voices, context, frequency * partial.ratio, partial.amp, partial.decay, when);
  }
  strikeHammer(voices, context, when);
}

function strikePartial(
  voices: Voices,
  context: AudioContext,
  frequency: number,
  amp: number,
  decay: number,
  when: number,
): void {
  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, when);
  const gain = context.createGain();
  const attack = Math.min(0.004, decay / 3);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(amp, when + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(when);
  oscillator.stop(when + decay + 0.02);
  voices.sources.push(oscillator);
  voices.gains.push(gain);
}

function strikeHammer(voices: Voices, context: AudioContext, when: number): void {
  const source = context.createBufferSource();
  source.buffer = hammer;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.28, when + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.016);
  source.connect(gain);
  gain.connect(context.destination);
  source.start(when);
  source.stop(when + 0.02);
  voices.sources.push(source);
  voices.gains.push(gain);
}

function makeHammer(context: AudioContext): AudioBuffer {
  const seconds = 0.016;
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    const time = i / context.sampleRate;
    const envelope = Math.exp(-time / 0.0022);
    const hashed = Math.sin(i * 12.9898) * 43758.5453;
    const unit = hashed - Math.floor(hashed);
    data[i] = (unit * 2 - 1) * envelope;
  }
  return buffer;
}
