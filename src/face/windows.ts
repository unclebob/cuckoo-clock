import { holiday } from "../calendar/holiday";
import { moon } from "../calendar/moon";

function element(
  name: string,
  attributes: Record<string, string>,
  parent: SVGElement,
): SVGElement {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, value);
  }
  parent.append(node);
  return node;
}

export function drawWindow(parent: SVGGElement): { update(date: Date): void } {
  element(
    "rect",
    {
      x: "-70",
      y: "0",
      width: "140",
      height: "74",
      rx: "5",
      fill: "#f8f1de",
      stroke: "#b68b3e",
      "stroke-width": "1.7",
    },
    parent,
  );
  element(
    "rect",
    {
      x: "-65",
      y: "4",
      width: "130",
      height: "66",
      rx: "3",
      fill: "none",
      stroke: "#e2c98a",
      "stroke-width": "0.8",
    },
    parent,
  );

  const month = line(parent, "0", "15", "12", "#3a2718");
  const weekday = line(parent, "0", "28", "11", "#5c4632");
  const date = line(parent, "0", "46", "16", "#2a1c12");
  date.setAttribute("font-weight", "700");
  const holidayLabel = line(parent, "-62", "59", "9", "#8a7056");
  holidayLabel.setAttribute("text-anchor", "start");
  holidayLabel.setAttribute("letter-spacing", "0.06em");
  holidayLabel.textContent = "Holiday";
  const holidayName = line(parent, "-14", "59", "10", "#6e2a32");
  holidayName.setAttribute("text-anchor", "start");
  const phase = line(parent, "0", "70", "10", "#3d4e68");

  return {
    update(when: Date): void {
      month.textContent = when.toLocaleDateString("en-US", { month: "long" });
      weekday.textContent = when.toLocaleDateString("en-US", { weekday: "long" });
      date.textContent = String(when.getDate());
      holidayName.textContent = holiday(when);
      phase.textContent = moon(when);
    },
  };
}

function line(
  parent: SVGGElement,
  x: string,
  y: string,
  size: string,
  fill: string,
): SVGTextElement {
  const node = element(
    "text",
    {
      x,
      y,
      "text-anchor": "middle",
      "font-family": "Palatino, 'Palatino Linotype', Georgia, serif",
      "font-size": size,
      fill,
    },
    parent,
  );
  return node as SVGTextElement;
}
