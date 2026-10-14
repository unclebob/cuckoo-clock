import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeParam {
  setValueAtTime(): void {}
  exponentialRampToValueAtTime(): void {}
}

class FakeGain {
  gain = new FakeParam();
  connect(): void {}
  disconnect(): void {}
}

class FakeSource {
  buffer: unknown = null;
  when = 0;
  offset = 0;
  span = 0;

  connect(): void {}

  start(when = 0, offset = 0, duration = 0): void {
    this.when = when;
    this.offset = offset;
    this.span = duration;
  }

  stop(): void {}
  disconnect(): void {}
}

class FakeOsc {
  freq = 0;
  when = 0;
  type = "sine";
  frequency = {
    setValueAtTime: (value: number): void => {
      this.freq = value;
    },
  };

  connect(): void {}

  start(when = 0): void {
    this.when = when;
  }

  stop(): void {}

  disconnect(): void {}
}

class FakeContext {
  static latest: FakeContext | null = null;

  state = "running";
  sampleRate = 8000;
  currentTime = 10;
  destination = {};
  sources: FakeSource[] = [];
  oscillators: FakeOsc[] = [];

  constructor() {
    FakeContext.latest = this;
  }

  resume(): Promise<void> {
    this.state = "running";
    return Promise.resolve();
  }

  createGain(): FakeGain {
    return new FakeGain();
  }

  createBufferSource(): FakeSource {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }

  createOscillator(): FakeOsc {
    const oscillator = new FakeOsc();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createBuffer(_channels: number, length: number, rate: number): { duration: number; getChannelData(): Float32Array } {
    return {
      duration: length / rate,
      getChannelData: () => new Float32Array(length),
    };
  }

  decodeAudioData(): Promise<{ duration: number }> {
    return Promise.resolve({ duration: 1 });
  }
}

function okResponse(): { ok: boolean; arrayBuffer(): Promise<ArrayBuffer> } {
  return { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) };
}

beforeEach(() => {
  FakeContext.latest = null;
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal("window", globalThis);
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function chimeModule(): Promise<typeof import("./chime")> {
  return import("./chime");
}

async function cuckooModule(): Promise<typeof import("./cuckoo")> {
  return import("./cuckoo");
}

async function ticModule(): Promise<typeof import("./tic")> {
  return import("./tic");
}

async function tokModule(): Promise<typeof import("./tok")> {
  return import("./tok");
}

const gSharp4 = 415.3;
const fSharp4 = 369.99;
const e4 = 329.63;
const b3 = 246.94;
const phrase1 = [gSharp4, fSharp4, e4, b3];
const phrase2 = [e4, gSharp4, fSharp4, b3];
const phrase3 = [e4, fSharp4, gSharp4, e4];
const phrase4 = [gSharp4, e4, fSharp4, b3];
const phrase5 = [b3, fSharp4, gSharp4, e4];
const rodPitches = new Set([gSharp4, fSharp4, e4, b3].map((pitch) => pitch.toFixed(2)));

function melody(oscillators: FakeOsc[]): string[] {
  return oscillators
    .filter((oscillator) => rodPitches.has(oscillator.freq.toFixed(2)))
    .map((oscillator) => `${oscillator.when.toFixed(2)} ${oscillator.freq.toFixed(2)}`);
}

function song(groups: number[][]): string[] {
  const notes: string[] = [];
  for (let phrase = 0; phrase < groups.length; phrase += 1) {
    const group = groups[phrase];
    for (let note = 0; note < group.length; note += 1) {
      const when = (10 + 0.05 + phrase * 3.52 + note * 0.72).toFixed(2);
      notes.push(`${when} ${group[note].toFixed(2)}`);
    }
  }
  return notes;
}

describe("chime", () => {
  it("loads once, plays the half hour, and stops", async () => {
    const chime = await chimeModule();
    await expect(chime.playChime(0)).resolves.toBeUndefined();
    const first = chime.loadChime();
    const second = chime.loadChime();
    await first;
    await second;
    await chime.loadChime();

    const context = FakeContext.latest;
    expect(context).not.toBeNull();
    context!.state = "suspended";
    const playing = chime.playChime(2);
    await vi.runAllTimersAsync();
    await playing;
    expect(melody(context!.oscillators)).toEqual(song([phrase2, phrase3]));
    chime.stopChime();
    chime.stopChime();
  });

  it("plays the Westminster phrases for each quarter", async () => {
    const chime = await chimeModule();
    await chime.loadChime();
    const context = FakeContext.latest!;

    const first = chime.playChime(1);
    await vi.runAllTimersAsync();
    await first;
    expect(melody(context.oscillators)).toEqual(song([phrase1]));

    const fromThird = context.oscillators.length;
    const three = chime.playChime(3);
    await vi.runAllTimersAsync();
    await three;
    expect(melody(context.oscillators.slice(fromThird))).toEqual(song([phrase4, phrase5, phrase1]));

    const fromHour = context.oscillators.length;
    const hour = chime.playChime(4);
    await vi.runAllTimersAsync();
    await hour;
    expect(melody(context.oscillators.slice(fromHour))).toEqual(song([phrase2, phrase3, phrase4, phrase5]));
  });

  it("unlocks a suspended context", async () => {
    const chime = await chimeModule();
    chime.unlockChime();
    const context = FakeContext.latest!;
    context.state = "suspended";
    chime.unlockChime();
    expect(context.state).toBe("running");
    chime.unlockChime();
  });
});

describe("cuckoo", () => {
  it("loads once, plays the call, and stops", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(okResponse())));
    const cuckoo = await cuckooModule();
    await expect(cuckoo.playCuckoo(0)).resolves.toBeUndefined();
    const first = cuckoo.loadCuckoo();
    const second = cuckoo.loadCuckoo();
    await first;
    await second;
    await cuckoo.loadCuckoo();
    const context = FakeContext.latest!;
    context.state = "suspended";
    const playing = cuckoo.playCuckoo(2);
    await vi.runAllTimersAsync();
    await playing;
    expect(context.sources).toHaveLength(2);
    cuckoo.stopCuckoo();
    cuckoo.stopCuckoo();
    context.state = "suspended";
    cuckoo.unlockCuckoo();
    expect(context.state).toBe("running");
    cuckoo.unlockCuckoo();
  });

  it("waits out a call that cannot be fetched", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
    const cuckoo = await cuckooModule();
    const playing = cuckoo.playCuckoo(1);
    await vi.runAllTimersAsync();
    await expect(playing).resolves.toBeUndefined();
  });
});

describe("tic and tok", () => {
  it("clicks when the context is running", async () => {
    const tic = await ticModule();
    tic.unlockTic();
    const made = FakeContext.latest!;
    made.state = "suspended";
    tic.unlockTic();
    expect(made.state).toBe("running");
    tic.unlockTic();
    made.state = "suspended";
    tic.playTic();
    tic.stopTic();
    made.state = "running";
    tic.playTic();
    tic.stopTic();
    tic.playTic();
    tic.stopTic();
    tic.stopTic();
  });

  it("knocks when the context is running", async () => {
    const tok = await tokModule();
    tok.unlockTok();
    const made = FakeContext.latest!;
    made.state = "suspended";
    tok.unlockTok();
    expect(made.state).toBe("running");
    tok.unlockTok();
    made.state = "suspended";
    tok.playTok();
    tok.stopTok();
    made.state = "running";
    tok.loadTok();
    tok.playTok();
    tok.stopTok();
    tok.playTok();
    tok.stopTok();
    tok.stopTok();
  });
});
