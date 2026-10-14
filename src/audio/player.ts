let shared: AudioContext | null = null;

export function audioContext(): AudioContext {
  if (!shared) {
    shared = new AudioContext();
  }
  return shared;
}

export function resumeContext(current: AudioContext): void {
  if (current.state !== "running") {
    void current.resume();
  }
}

export type Clip = {
  buffer: AudioBuffer | null;
  loading: Promise<void> | null;
};

export function fetchClip(url: string, context: AudioContext, failure: string): Promise<AudioBuffer> {
  return fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error(failure);
    }
    const bytes = await response.arrayBuffer();
    return context.decodeAudioData(bytes.slice(0));
  });
}

export function loadClip(clip: Clip, url: string, failure: string, context: AudioContext): Promise<void> {
  if (clip.buffer) {
    return Promise.resolve();
  }
  if (clip.loading) {
    return clip.loading;
  }
  clip.loading = fetchClip(url, context, failure)
    .then((decoded) => {
      clip.buffer = decoded;
    })
    .catch((error: unknown) => {
      clip.loading = null;
      throw error;
    });
  return clip.loading;
}

export type Voices = {
  sources: AudioScheduledSourceNode[];
  gains: GainNode[];
  timer: number;
  finish: (() => void) | null;
};

export function finishVoices(voices: Voices, totalMs: number): Promise<void> {
  return new Promise((resolve) => {
    voices.finish = resolve;
    voices.timer = window.setTimeout(() => {
      voices.finish = null;
      resolve();
    }, totalMs);
  });
}

type Repeat = {
  duration: number;
  gap: number;
  lead: number;
  peak: number;
  ramp: number;
  hold: number;
  tail: number;
  span: number | null;
};

export function scheduleRepeats(
  voices: Voices,
  context: AudioContext,
  buffer: AudioBuffer,
  count: number,
  shape: Repeat,
): void {
  const startAt = context.currentTime + shape.lead;
  for (let repeat = 0; repeat < count; repeat += 1) {
    const when = startAt + repeat * (shape.duration + shape.gap);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(shape.peak, when + shape.ramp);
    const releaseAt = Math.max(when + shape.hold, when + shape.duration - shape.tail);
    gain.gain.setValueAtTime(shape.peak, releaseAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + shape.duration);
    source.connect(gain);
    gain.connect(context.destination);
    if (shape.span === null) {
      source.start(when);
    } else {
      source.start(when, 0, shape.span);
    }
    source.stop(when + shape.duration + 0.02);
    voices.sources.push(source);
    voices.gains.push(gain);
  }
}

function endSource(source: AudioScheduledSourceNode): void {
  try {
    source.stop();
  } catch {
    // stop() throws once a source has already ended.
  }
  source.disconnect();
}

export function stopVoices(voices: Voices): void {
  window.clearTimeout(voices.timer);
  voices.timer = 0;
  for (const source of voices.sources) {
    endSource(source);
  }
  voices.sources = [];
  for (const gain of voices.gains) {
    gain.disconnect();
  }
  voices.gains = [];
  const resolve = voices.finish;
  voices.finish = null;
  resolve?.();
}

export type Voice = {
  source: AudioBufferSourceNode | null;
  gain: GainNode | null;
};

export function startVoice(
  context: AudioContext,
  voice: Voice,
  buffer: AudioBuffer | null,
  peak: number,
  attack: number,
  release: number,
): void {
  const next = context.createBufferSource();
  next.buffer = buffer;
  const level = context.createGain();
  const when = context.currentTime;
  level.gain.setValueAtTime(0.0001, when);
  level.gain.exponentialRampToValueAtTime(peak, when + attack);
  level.gain.exponentialRampToValueAtTime(0.0001, when + release);
  next.connect(level);
  level.connect(context.destination);
  next.start(when);
  voice.source = next;
  voice.gain = level;
}

export function stopVoice(voice: Voice): void {
  if (!voice.source) {
    return;
  }
  voice.source.stop();
  voice.source.disconnect();
  voice.gain?.disconnect();
  voice.source = null;
  voice.gain = null;
}
