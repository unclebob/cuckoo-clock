import { element } from "./element";
import { drawWindow } from "./windows";

export type BirdMode = "home" | "out" | "singing";

export type ClockScene = {
  svg: SVGSVGElement;
  hourHand: SVGGElement;
  minuteHand: SVGGElement;
  secondHand: SVGGElement;
  pendulum: SVGGElement;
  updateWindow(date: Date): void;
  setDoors(open: boolean): void;
  setBird(mode: BirdMode): void;
  step(nowMs: number): void;
};

const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

let doorOpenness = 0;
let doorTarget = 0;
let birdDrop = 0;
let birdTarget = 0;
let singing = false;

export function chapterMark(mark: number): { inner: number; stroke: string; width: string } {
  if (mark % 5 === 0) {
    return { inner: 124, stroke: "#5c4318", width: "2.4" };
  }
  return { inner: 136, stroke: "#8a7040", width: "1" };
}

export function nextMotion(
  openness: number,
  doorGoal: number,
  drop: number,
  perch: number,
  singingNow: boolean,
  nowMs: number,
): {
  doorOpenness: number;
  birdDrop: number;
  leftTransform: string;
  rightTransform: string;
  birdTransform: string;
  beakOpen: string;
  beakClosed: string;
} {
  let doors = openness + (doorGoal - openness) * 0.14;
  if (Math.abs(doorGoal - doors) < 0.004) {
    doors = doorGoal;
  }
  const scale = 1 - doors * 0.9;
  const nextDrop = drop + (perch - drop) * 0.16;
  const bob = singingNow ? Math.sin(nowMs / 155) * 5 : 0;
  const tilt = singingNow ? Math.sin(nowMs / 155) * 8 : 0;
  const mouth = singingNow && Math.sin(nowMs / 155) > -0.15 ? "1" : "0";
  return {
    doorOpenness: doors,
    birdDrop: nextDrop,
    leftTransform: `translate(174 0) scale(${scale} 1) translate(-174 0)`,
    rightTransform: `translate(386 0) scale(${scale} 1) translate(-386 0)`,
    birdTransform: `translate(280 ${246 + nextDrop + bob}) rotate(${tilt})`,
    beakOpen: mouth,
    beakClosed: mouth === "1" ? "0" : "1",
  };
}

export function drawDial(host: Element): ClockScene {
  host.innerHTML = markup;
  const svg = host.querySelector("svg");
  if (!svg) {
    throw new Error("The clock face did not draw.");
  }
  const dial = required(svg, "#dial");
  const hourHand = required(svg, "#hour-hand");
  const minuteHand = required(svg, "#minute-hand");
  const secondHand = required(svg, "#second-hand");
  const pendulum = required(svg, "#pendulum");
  const leftDoor = required(svg, "#door-left");
  const rightDoor = required(svg, "#door-right");
  const bird = required(svg, "#bird");
  const beakOpen = required(svg, "#beak-open");
  const beakClosed = required(svg, "#beak-closed");
  const windowGroup = required(svg, "#window");
  const faceWindow = drawWindow(windowGroup);

  drawChapter(dial);
  drawNumerals(dial);
  drawOrnament(dial);
  drawHands(hourHand, minuteHand, secondHand);
  dial.append(windowGroup, hourHand, minuteHand, secondHand);
  drawHub(dial);

  return {
    svg,
    hourHand,
    minuteHand,
    secondHand,
    pendulum,
    updateWindow(date: Date): void {
      faceWindow.update(date);
    },
    setDoors(open: boolean): void {
      doorTarget = open ? 1 : 0;
    },
    setBird(mode: BirdMode): void {
      singing = mode === "singing";
      birdTarget = mode === "home" ? 0 : 76;
    },
    step(nowMs: number): void {
      const motion = nextMotion(doorOpenness, doorTarget, birdDrop, birdTarget, singing, nowMs);
      doorOpenness = motion.doorOpenness;
      birdDrop = motion.birdDrop;
      leftDoor.setAttribute("transform", motion.leftTransform);
      rightDoor.setAttribute("transform", motion.rightTransform);
      bird.setAttribute("transform", motion.birdTransform);
      beakOpen.setAttribute("opacity", motion.beakOpen);
      beakClosed.setAttribute("opacity", motion.beakClosed);
    },
  };
}

function drawChapter(dial: SVGGElement): void {
  for (let mark = 0; mark < 60; mark += 1) {
    const theta = (mark * Math.PI) / 30;
    const style = chapterMark(mark);
    const outer = 147;
    element(
      "line",
      {
        x1: String(Math.sin(theta) * style.inner),
        y1: String(-Math.cos(theta) * style.inner),
        x2: String(Math.sin(theta) * outer),
        y2: String(-Math.cos(theta) * outer),
        stroke: style.stroke,
        "stroke-width": style.width,
        "stroke-linecap": "round",
      },
      dial,
    );
  }
}

function drawNumerals(dial: SVGGElement): void {
  for (let hour = 0; hour < 12; hour += 1) {
    const theta = (hour * Math.PI) / 6;
    const node = element(
      "text",
      {
        x: String(Math.sin(theta) * 112),
        y: String(-Math.cos(theta) * 112),
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-family": "Palatino, 'Palatino Linotype', Georgia, serif",
        "font-size": hour === 0 ? "17" : "15",
        "font-weight": "600",
        fill: "#2c1c10",
      },
      dial,
    );
    node.textContent = ROMAN[hour] ?? "";
  }
}

function drawOrnament(dial: SVGGElement): void {
  const spray = element("g", { transform: "translate(0 -58)" }, dial);
  leaf(spray, -26, 6, -50);
  leaf(spray, 26, 6, 50);
  leaf(spray, 0, 16, 8);
  leaf(spray, -8, 12, -15);
  rose(spray, -14, -4, 0.9);
  rose(spray, 13, -1, 0.78);
}

function drawHands(hour: SVGGElement, minute: SVGGElement, second: SVGGElement): void {
  hour.innerHTML = `
    <path d="M0,12 C9,8 7,-24 4,-58 L0,-82 L-4,-58 C-7,-24 -9,8 0,12 Z" fill="#1a120c"/>
    <path d="M0,-34 L3.2,-56 L0,-74 L-3.2,-56 Z" fill="#4a3424"/>
  `;
  minute.innerHTML = `
    <path d="M0,14 L2.1,4 L1.15,-100 L0,-122 L-1.15,-100 L-2.1,4 Z" fill="#1a120c"/>
    <circle cy="-114" r="3.2" fill="#1a120c"/>
  `;
  second.innerHTML = `
    <line x1="0" y1="16" x2="0" y2="-132" stroke="#9d1c2c" stroke-width="1.5" stroke-linecap="round"/>
    <circle cy="14" r="4" fill="#9d1c2c"/>
  `;
}

function drawHub(dial: SVGGElement): void {
  element("circle", { r: "8", fill: "#e4c57a", stroke: "#7c5c2a", "stroke-width": "1.2" }, dial);
  element("circle", { r: "2.6", fill: "#5a3e1c" }, dial);
}

function leaf(parent: SVGElement, x: number, y: number, rotation: number): void {
  element(
    "ellipse",
    {
      cx: String(x),
      cy: String(y),
      rx: "11",
      ry: "5",
      fill: "#2f6a3c",
      stroke: "#1d4428",
      "stroke-width": "0.6",
      transform: `rotate(${rotation} ${x} ${y})`,
    },
    parent,
  );
  element(
    "line",
    {
      x1: String(x - 7),
      y1: String(y),
      x2: String(x + 7),
      y2: String(y),
      stroke: "#d7e6b8",
      "stroke-width": "0.7",
      transform: `rotate(${rotation} ${x} ${y})`,
    },
    parent,
  );
}

function rose(parent: SVGElement, x: number, y: number, scale: number): void {
  const group = element("g", { transform: `translate(${x} ${y}) scale(${scale})` }, parent);
  const petals: Array<[number, number, number]> = [
    [0, -6, -18],
    [6, -2, 55],
    [4, 6, 125],
    [-4, 6, 200],
    [-6, -2, 250],
  ];
  for (const [px, py, rotation] of petals) {
    element(
      "ellipse",
      {
        cx: String(px),
        cy: String(py),
        rx: "4.6",
        ry: "7.2",
        fill: "#b43346",
        stroke: "#7c2432",
        "stroke-width": "0.4",
        transform: `rotate(${rotation} ${px} ${py})`,
      },
      group,
    );
  }
  element("circle", { r: "3", fill: "#e6b34a", stroke: "#a67c28", "stroke-width": "0.4" }, group);
}

function required(svg: SVGSVGElement, selector: string): SVGGElement {
  const node = svg.querySelector(selector);
  if (!node) {
    throw new Error(`Missing ${selector}`);
  }
  return node as SVGGElement;
}

const markup = `
<svg viewBox="-24 -8 608 1088" role="img" aria-label="Cuckoo clock">
  <defs>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8a5a36"/>
      <stop offset="0.38" stop-color="#5a341c"/>
      <stop offset="0.72" stop-color="#3d2414"/>
      <stop offset="1" stop-color="#2a160d"/>
    </linearGradient>
    <linearGradient id="door-wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a06a3e"/>
      <stop offset="0.4" stop-color="#6b4124"/>
      <stop offset="1" stop-color="#4a2c18"/>
    </linearGradient>
    <radialGradient id="face" cx="50%" cy="40%" r="68%">
      <stop offset="0" stop-color="#fff9ec"/>
      <stop offset="0.62" stop-color="#f4e6c6"/>
      <stop offset="1" stop-color="#e4cfa4"/>
    </radialGradient>
    <radialGradient id="brass" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#f4e2a8"/>
      <stop offset="0.45" stop-color="#d4a85a"/>
      <stop offset="1" stop-color="#8a6430"/>
    </radialGradient>
    <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6b4226"/>
      <stop offset="1" stop-color="#3a2214"/>
    </linearGradient>
  </defs>

  <path fill="url(#wood)" stroke="#24140c" stroke-width="3" stroke-linejoin="round"
    d="M280 12 L524 176 L470 198 L470 1044 L90 1044 L90 198 L36 176 Z"/>
  <path fill="#2a170f" d="M280 40 L492 170 L458 188 L280 78 L102 188 L68 170 Z"/>
  <path fill="none" stroke="#8a5a36" stroke-width="2" opacity="0.35"
    d="M128 260 C180 300 220 420 150 560 M430 260 C380 310 360 430 410 560 M140 700 C200 760 180 900 150 1000 M420 700 C360 780 390 900 410 1000"/>
  <path fill="#1a0e09" d="M164 300 L164 214 Q164 168 280 168 Q396 168 396 214 L396 300 Z"/>
  <ellipse cx="280" cy="888" rx="74" ry="128" fill="#100904"/>
  <ellipse cx="280" cy="888" rx="74" ry="128" fill="none" stroke="#4a2c18" stroke-width="8"/>

  <g id="weights">
    <g transform="translate(168 790)">
      <line x1="0" y1="0" x2="0" y2="118" stroke="#c6a15a" stroke-width="1.5"/>
      <ellipse cy="18" rx="3.4" ry="6" fill="none" stroke="#d4b36a" stroke-width="1.4"/>
      <ellipse cy="32" rx="3.4" ry="6" fill="none" stroke="#d4b36a" stroke-width="1.4"/>
      <ellipse cy="46" rx="3.4" ry="6" fill="none" stroke="#d4b36a" stroke-width="1.4"/>
      <g transform="translate(0 132)">
        <ellipse cy="-6" rx="5" ry="4" fill="#d4b36a"/>
        <ellipse cy="2" rx="9" ry="6" fill="#6b4424"/>
        <ellipse cy="10" rx="12" ry="7" fill="#5a3818"/>
        <ellipse cy="18" rx="13" ry="7" fill="#4a2e16"/>
        <ellipse cy="26" rx="11" ry="7" fill="#3d2612"/>
        <ellipse cy="33" rx="7" ry="6" fill="#2c1a0c"/>
      </g>
    </g>
    <g transform="translate(392 790)">
      <line x1="0" y1="0" x2="0" y2="146" stroke="#c6a15a" stroke-width="1.5"/>
      <ellipse cy="20" rx="3.4" ry="6" fill="none" stroke="#d4b36a" stroke-width="1.4"/>
      <ellipse cy="36" rx="3.4" ry="6" fill="none" stroke="#d4b36a" stroke-width="1.4"/>
      <ellipse cy="52" rx="3.4" ry="6" fill="none" stroke="#d4b36a" stroke-width="1.4"/>
      <ellipse cy="68" rx="3.4" ry="6" fill="none" stroke="#d4b36a" stroke-width="1.4"/>
      <g transform="translate(0 164)">
        <ellipse cy="-6" rx="5" ry="4" fill="#d4b36a"/>
        <ellipse cy="2" rx="9" ry="6" fill="#6b4424"/>
        <ellipse cy="10" rx="12" ry="7" fill="#5a3818"/>
        <ellipse cy="18" rx="13" ry="7" fill="#4a2e16"/>
        <ellipse cy="26" rx="11" ry="7" fill="#3d2612"/>
        <ellipse cy="33" rx="7" ry="6" fill="#2c1a0c"/>
      </g>
    </g>
  </g>

  <g id="pendulum-mount" transform="translate(280 748)">
    <g id="pendulum">
      <rect x="-2.3" y="0" width="4.6" height="196" rx="2" fill="url(#brass)"/>
      <circle cy="208" r="30" fill="url(#brass)" stroke="#6e5424" stroke-width="3"/>
      <circle cy="208" r="18" fill="none" stroke="#f3e0aa" stroke-width="1.6"/>
      <circle cy="208" r="5" fill="#5c401c"/>
    </g>
  </g>

  <g id="bird" transform="translate(280 246)">
    <polygon points="-36,2 -16,-8 -14,6" fill="#5a3a22"/>
    <polygon points="-32,-4 -14,-14 -12,0" fill="#6d4a30"/>
    <ellipse cx="-2" cy="2" rx="18" ry="12" fill="#6e4a2e"/>
    <ellipse cx="1" cy="6" rx="11" ry="7.5" fill="#f3e4c6"/>
    <ellipse cx="-4" cy="1" rx="9" ry="6.5" fill="#5a3b24" transform="rotate(-18 -4 1)"/>
    <circle cx="14" cy="-5" r="8" fill="#6e4a2e"/>
    <circle cx="16.4" cy="-7" r="1.7" fill="#1a120c"/>
    <circle cx="17" cy="-7.6" r="0.55" fill="#fffaf0"/>
    <g id="beak-closed">
      <polygon points="20,-5 36,-2 20,0" fill="#e2a325"/>
    </g>
    <g id="beak-open" opacity="0">
      <polygon points="20,-6 36,-8 23,-2" fill="#e2a325"/>
      <polygon points="20,-1 36,4 23,2" fill="#c98418"/>
      <polygon points="22,-2 29,-1 22,1" fill="#a83232"/>
    </g>
    <path d="M-2 13 L-2 20 M-2 20 L-7 23 M-2 20 L-2 24 M-2 20 L3 23" fill="none" stroke="#c98418" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M6 12 L6 20 M6 20 L2 23 M6 20 L6 24 M6 20 L11 23" fill="none" stroke="#c98418" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <g id="door-left">
    <path d="M174 196 H278 V300 Q278 312 174 312 Z" fill="url(#door-wood)" stroke="#24140c" stroke-width="2"/>
    <rect x="188" y="210" width="76" height="84" rx="4" fill="none" stroke="#2a160e" stroke-width="2"/>
    <ellipse cx="214" cy="246" rx="7" ry="5" fill="#2f6a3c" transform="rotate(-30 214 246)"/>
    <circle cx="226" cy="242" r="5" fill="#b43346"/>
    <circle cx="226" cy="242" r="2" fill="#e6b34a"/>
  </g>
  <g id="door-right">
    <path d="M282 196 H386 V312 Q282 312 282 300 Z" fill="url(#door-wood)" stroke="#24140c" stroke-width="2"/>
    <rect x="296" y="210" width="76" height="84" rx="4" fill="none" stroke="#2a160e" stroke-width="2"/>
    <ellipse cx="346" cy="246" rx="7" ry="5" fill="#2f6a3c" transform="rotate(30 346 246)"/>
    <circle cx="334" cy="242" r="5" fill="#b43346"/>
    <circle cx="334" cy="242" r="2" fill="#e6b34a"/>
  </g>
  <rect x="166" y="228" width="10" height="28" rx="2" fill="#2a170f"/>
  <rect x="384" y="228" width="10" height="28" rx="2" fill="#2a170f"/>
  <path d="M158 308 L158 210 Q158 156 280 156 Q402 156 402 210 L402 308" fill="none" stroke="#6b4226" stroke-width="8"/>
  <path d="M158 308 L158 210 Q158 156 280 156 Q402 156 402 210 L402 308" fill="none" stroke="#c6a15a" stroke-width="1.4"/>

  <g id="dial" transform="translate(280 560)">
    <circle r="176" fill="#4a2c18" stroke="#24140c" stroke-width="3"/>
    <circle r="164" fill="none" stroke="#d4b36a" stroke-width="6"/>
    <circle r="156" fill="url(#face)"/>
    <circle r="120" fill="none" stroke="#c6a15a" stroke-width="1.4"/>
    <g id="window" transform="translate(0 24)"></g>
    <g id="hour-hand"></g>
    <g id="minute-hand"></g>
    <g id="second-hand"></g>
  </g>

  <g fill="#3d6b3c" stroke="#1c4426" stroke-width="0.6">
    <ellipse cx="118" cy="150" rx="26" ry="9" transform="rotate(-42 118 150)"/>
    <ellipse cx="168" cy="112" rx="24" ry="8" transform="rotate(-32 168 112)"/>
    <ellipse cx="214" cy="78" rx="22" ry="8" transform="rotate(-20 214 78)"/>
    <ellipse cx="252" cy="52" rx="18" ry="7" transform="rotate(-8 252 52)"/>
    <ellipse cx="308" cy="52" rx="18" ry="7" transform="rotate(8 308 52)"/>
    <ellipse cx="346" cy="78" rx="22" ry="8" transform="rotate(20 346 78)"/>
    <ellipse cx="392" cy="112" rx="24" ry="8" transform="rotate(32 392 112)"/>
    <ellipse cx="442" cy="150" rx="26" ry="9" transform="rotate(42 442 150)"/>
  </g>
  <g fill="#6fa56a" opacity="0.85">
    <ellipse cx="146" cy="128" rx="14" ry="5" transform="rotate(-36 146 128)"/>
    <ellipse cx="196" cy="92" rx="13" ry="5" transform="rotate(-26 196 92)"/>
    <ellipse cx="364" cy="92" rx="13" ry="5" transform="rotate(26 364 92)"/>
    <ellipse cx="414" cy="128" rx="14" ry="5" transform="rotate(36 414 128)"/>
  </g>
  <circle cx="280" cy="36" r="12" fill="#5a341c" stroke="#24140c" stroke-width="2"/>
  <circle cx="280" cy="22" r="5.5" fill="#6b4226" stroke="#24140c" stroke-width="1.5"/>
</svg>
`;
