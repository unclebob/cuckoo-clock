import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

type Pending = { count: number; resolve: () => void };

const audio = vi.hoisted(() => {
  const tics: number[] = [];
  const toks: number[] = [];
  const chimes: Pending[] = [];
  const cuckoos: Pending[] = [];
  return {
    tics,
    toks,
    chimes,
    cuckoos,
    playTic: () => {
      tics.push(1);
    },
    playTok: () => {
      toks.push(1);
    },
    playChime: (count: number) =>
      new Promise<void>((resolve) => {
        chimes.push({ count, resolve });
      }),
    playCuckoo: (count: number) =>
      new Promise<void>((resolve) => {
        cuckoos.push({ count, resolve });
      }),
  };
});

vi.mock("./audio/chime", () => ({
  loadChime: () => Promise.resolve(),
  playChime: (count: number) => audio.playChime(count),
  stopChime: () => undefined,
  unlockChime: () => undefined,
}));

vi.mock("./audio/cuckoo", () => ({
  loadCuckoo: () => Promise.resolve(),
  playCuckoo: (count: number) => audio.playCuckoo(count),
  stopCuckoo: () => undefined,
  unlockCuckoo: () => undefined,
}));

vi.mock("./audio/tic", () => ({
  playTic: () => audio.playTic(),
  unlockTic: () => undefined,
}));

vi.mock("./audio/tok", () => ({
  playTok: () => audio.playTok(),
  unlockTok: () => undefined,
}));

class FakeClassList {
  private names = new Set<string>();

  add(name: string): void {
    this.names.add(name);
  }

  contains(name: string): boolean {
    return this.names.has(name);
  }
}

class FakeNode {
  tag: string;
  id = "";
  parent: FakeNode | null = null;
  children: FakeNode[] = [];
  textContent = "";
  classList = new FakeClassList();
  private attrs = new Map<string, string>();
  private listeners = new Map<string, Array<() => void>>();

  constructor(tag: string) {
    this.tag = tag;
  }

  createElementNS(_namespace: string, name: string): FakeNode {
    return new FakeNode(name);
  }

  set innerHTML(value: string) {
    this.children = [];
    for (const child of parseMarkup(value)) {
      this.adopt(child);
    }
  }

  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value);
    if (name === "id") {
      this.id = value;
    }
  }

  getAttribute(name: string): string | null {
    return this.attrs.get(name) ?? null;
  }

  append(...nodes: FakeNode[]): void {
    for (const node of nodes) {
      node.detach();
      this.adopt(node);
    }
  }

  addEventListener(type: string, listener: () => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener();
    }
  }

  querySelector(selector: string): FakeNode | null {
    for (const child of this.children) {
      if (child.matches(selector)) {
        return child;
      }
      const found = child.querySelector(selector);
      if (found) {
        return found;
      }
    }
    return null;
  }

  detach(): void {
    if (!this.parent) {
      return;
    }
    const index = this.parent.children.indexOf(this);
    if (index >= 0) {
      this.parent.children.splice(index, 1);
    }
    this.parent = null;
  }

  private adopt(child: FakeNode): void {
    child.parent = this;
    this.children.push(child);
  }

  private matches(selector: string): boolean {
    if (selector.startsWith("#")) {
      return this.id === selector.slice(1);
    }
    return this.tag === selector;
  }
}

function parseMarkup(source: string): FakeNode[] {
  const roots: FakeNode[] = [];
  const stack: FakeNode[] = [];
  const place = (node: FakeNode): void => {
    const parent = stack[stack.length - 1];
    if (parent) {
      parent.append(node);
      return;
    }
    roots.push(node);
  };
  const pattern = /<!--[\s\S]*?-->|<\/?([A-Za-z][\w:-]*)([^>]*)>/g;
  for (const match of source.matchAll(pattern)) {
    if (match[0].startsWith("<!--")) {
      continue;
    }
    const name = match[1];
    if (match[0].startsWith("</")) {
      const node = stack.pop();
      if (!node || node.tag !== name) {
        throw new Error(`unbalanced ${name}`);
      }
      place(node);
      continue;
    }
    const node = new FakeNode(name);
    const body = (match[2] ?? "").replace(/\/\s*$/, "");
    for (const attr of body.matchAll(/([^\s=]+)="([^"]*)"/g)) {
      node.setAttribute(attr[1], attr[2]);
    }
    if ((match[2] ?? "").trimEnd().endsWith("/")) {
      place(node);
    } else {
      stack.push(node);
    }
  }
  if (stack.length !== 0) {
    throw new Error(`unclosed ${stack.map((node) => node.tag).join(",")}`);
  }
  return roots;
}

function walk(node: FakeNode, visit: (node: FakeNode) => void): void {
  visit(node);
  for (const child of node.children) {
    walk(child, visit);
  }
}

function chapterPoint(mark: number): { x1: string; y1: string; x2: string; y2: string } {
  const theta = (mark * Math.PI) / 30;
  const inner = mark % 5 === 0 ? 124 : 136;
  const outer = 147;
  return {
    x1: String(Math.sin(theta) * inner),
    y1: String(-Math.cos(theta) * inner),
    x2: String(Math.sin(theta) * outer),
    y2: String(-Math.cos(theta) * outer),
  };
}

function numeralPoint(hour: number): { x: string; y: string } {
  const theta = (hour * Math.PI) / 6;
  return {
    x: String(Math.sin(theta) * 112),
    y: String(-Math.cos(theta) * 112),
  };
}

const frames: FrameRequestCallback[] = [];
const documentNode = new FakeNode("document");
const body = new FakeNode("body");
const app = new FakeNode("div");
const hint = new FakeNode("p");
app.id = "app";
hint.id = "hint";
documentNode.append(body);
body.append(app, hint);

let start: () => void;

function face(): FakeNode {
  const svg = app.querySelector("svg");
  if (!svg) {
    throw new Error("missing svg");
  }
  return svg;
}

function attr(selector: string, name: string): string | null {
  return face().querySelector(selector)?.getAttribute(name) ?? null;
}

function birdY(): number {
  const transform = attr("#bird", "transform") ?? "";
  const found = /translate\(280 (-?\d+(?:\.\d+)?)\)/.exec(transform);
  if (!found) {
    throw new Error(transform);
  }
  return Number(found[1]);
}

async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

function frame(nowMs: number): void {
  const next = frames.shift();
  if (!next) {
    throw new Error("no frame");
  }
  next(nowMs);
}

async function takeChime(): Promise<number> {
  const pending = audio.chimes.shift();
  if (!pending) {
    throw new Error("expected a chime");
  }
  pending.resolve();
  await settle();
  return pending.count;
}

async function takeCuckoo(): Promise<number> {
  const pending = audio.cuckoos.shift();
  if (!pending) {
    throw new Error("expected a cuckoo");
  }
  pending.resolve();
  await settle();
  return pending.count;
}

function at(hour: number, minute: number, second: number): void {
  vi.setSystemTime(new Date(2026, 9, 12, hour, minute, second));
}

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  at(10, 14, 58);
  vi.stubGlobal("document", documentNode);
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  const main = await import("./main");
  start = main.start;
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("page", () => {
  it("draws the face, keeps time, and plays the quarters", async () => {
    const svg = face();
    const dial = svg.querySelector("#dial");
    if (!dial) {
      throw new Error("missing dial");
    }
    const marks = [] as FakeNode[];
    walk(dial, (node) => {
      const stroke = node.getAttribute("stroke");
      if (node.tag === "line" && (stroke === "#5c4318" || stroke === "#8a7040")) {
        marks.push(node);
      }
    });
    expect(marks).toHaveLength(60);
    const noon = chapterPoint(0);
    const three = chapterPoint(15);
    expect(marks.some((mark) => mark.getAttribute("y1") === noon.y1 && mark.getAttribute("y2") === noon.y2)).toBe(
      true,
    );
    const quarter = marks.find((mark) => mark.getAttribute("x1") === three.x1);
    expect(quarter?.getAttribute("y1")).toBe(three.y1);
    expect(quarter?.getAttribute("x2")).toBe(three.x2);
    expect(quarter?.getAttribute("y2")).toBe(three.y2);

    const numerals = dial.children.filter((child) => child.tag === "text");
    expect(numerals.map((node) => node.textContent)).toEqual([
      "XII",
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
    ]);
    const origin = numeralPoint(0);
    const east = numeralPoint(3);
    expect(numerals[0]?.getAttribute("x")).toBe(origin.x);
    expect(numerals[0]?.getAttribute("y")).toBe(origin.y);
    expect(numerals[0]?.getAttribute("font-size")).toBe("17");
    expect(numerals[3]?.getAttribute("x")).toBe(east.x);
    expect(numerals[3]?.getAttribute("y")).toBe(east.y);
    expect(numerals[3]?.getAttribute("font-size")).toBe("15");

    const spray = dial.children.find((child) => child.getAttribute("transform") === "translate(0 -58)");
    if (!spray) {
      throw new Error("missing ornament");
    }
    const leaves = spray.children.filter((child) => child.tag === "ellipse");
    const veins = spray.children.filter((child) => child.tag === "line");
    expect(leaves[0]?.getAttribute("cx")).toBe("-26");
    expect(leaves[0]?.getAttribute("transform")).toBe("rotate(-50 -26 6)");
    expect(leaves[2]?.getAttribute("cx")).toBe("0");
    expect(leaves[3]?.getAttribute("cx")).toBe("-8");
    expect(leaves[3]?.getAttribute("transform")).toBe("rotate(-15 -8 12)");
    expect(veins[0]?.getAttribute("x1")).toBe("-33");
    expect(veins[0]?.getAttribute("x2")).toBe("-19");
    const roses = spray.children.filter((child) => child.tag === "g");
    expect(roses[0]?.getAttribute("transform")).toBe("translate(-14 -4) scale(0.9)");
    expect(roses[1]?.getAttribute("transform")).toBe("translate(13 -1) scale(0.78)");
    const petals = roses[0]?.children.filter((child) => child.tag === "ellipse") ?? [];
    expect(petals[0]?.getAttribute("cx")).toBe("0");
    expect(petals[0]?.getAttribute("cy")).toBe("-6");
    expect(petals[0]?.getAttribute("transform")).toBe("rotate(-18 0 -6)");
    expect(petals[1]?.getAttribute("cy")).toBe("-2");
    expect(petals[3]?.getAttribute("cx")).toBe("-4");
    expect(petals[4]?.getAttribute("cx")).toBe("-6");
    expect(petals[4]?.getAttribute("cy")).toBe("-2");
    expect(attr("#beak-open", "opacity")).toBe("0");

    frame(1500);
    expect(attr("#hour-hand", "transform")).toBe("rotate(307.4833333333333)");
    expect(attr("#minute-hand", "transform")).toBe("rotate(89.80000000000001)");
    expect(attr("#second-hand", "transform")).toBe("rotate(348)");
    expect(audio.tics).toHaveLength(0);
    expect(svg.getAttribute("aria-label")).toBe("Cuckoo clock");
    frame(0);
    face().dispatch("pointerdown");
    expect(hint.classList.contains("hidden")).toBe(true);
    frame(1500);
    expect(audio.tics).toHaveLength(1);
    expect(audio.toks).toHaveLength(0);
    frame(0);
    frame(500);
    expect(audio.tics).toHaveLength(1);
    expect(audio.toks).toHaveLength(1);
    expect(face().getAttribute("aria-label")).toBe("Cuckoo clock");

    at(10, 14, 59);
    frame(0);
    expect(attr("#hour-hand", "transform")).toBe("rotate(307.4916666666666)");
    expect(attr("#minute-hand", "transform")).toBe("rotate(89.90000000000003)");
    expect(attr("#second-hand", "transform")).toBe("rotate(354)");
    expect(face().getAttribute("aria-label")).toBe("Cuckoo clock, 10:14:59");
    expect(audio.chimes).toHaveLength(0);

    at(10, 15, 0);
    frame(0);
    expect(await takeChime()).toBe(1);
    expect(audio.cuckoos).toHaveLength(0);
    frame(0);
    expect(attr("#door-left", "transform")).toContain("scale(1 1)");

    at(10, 15, 1);
    frame(0);
    at(12, 59, 59);
    frame(0);
    at(13, 0, 0);
    frame(0);
    expect(face().getAttribute("aria-label")).toBe("Cuckoo clock, 13:00:00");
    expect(await takeChime()).toBe(4);
    frame(0);
    expect(attr("#door-left", "transform")).toContain("scale(0.874 1)");
    await vi.advanceTimersByTimeAsync(720);
    frame(0);
    expect(attr("#beak-open", "opacity")).toBe("1");
    expect(attr("#beak-closed", "opacity")).toBe("0");
    expect(await takeCuckoo()).toBe(1);
    await vi.advanceTimersByTimeAsync(320);
    await vi.advanceTimersByTimeAsync(560);
    for (let step = 0; step < 40; step += 1) {
      frame(0);
    }
    expect(attr("#door-left", "transform")).toContain("scale(1 1)");
    expect(birdY()).toBeCloseTo(246, 0);
    expect(attr("#beak-open", "opacity")).toBe("0");

    at(13, 59, 59);
    frame(0);
    at(14, 0, 0);
    frame(0);
    expect(await takeChime()).toBe(4);
    at(14, 15, 0);
    frame(0);
    await vi.advanceTimersByTimeAsync(720);
    frame(0);
    expect(birdY()).toBeCloseTo(246, 0);
    expect(await takeChime()).toBe(1);
    expect(audio.cuckoos).toHaveLength(0);

    at(14, 59, 59);
    frame(0);
    at(15, 0, 0);
    frame(0);
    expect(await takeChime()).toBe(4);
    await vi.advanceTimersByTimeAsync(720);
    expect(await takeCuckoo()).toBe(3);
    at(15, 15, 0);
    frame(0);
    await vi.advanceTimersByTimeAsync(320);
    frame(0);
    expect(attr("#beak-open", "opacity")).toBe("0");
    expect(await takeChime()).toBe(1);

    hint.detach();
    at(15, 15, 1);
    start();
    face().dispatch("pointerdown");
    app.detach();
    expect(() => start()).not.toThrow();
  });
});
