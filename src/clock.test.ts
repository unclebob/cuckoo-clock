import { describe, expect, it } from "vitest";
import { easter } from "./calendar/easter";
import { holiday } from "./calendar/holiday";
import { moon } from "./calendar/moon";
import { hourHand } from "./hands/hourHand";
import { minuteHand } from "./hands/minuteHand";
import { secondHand } from "./hands/secondHand";
import { strike } from "./strike/strike";

const MOON_NAMES = [
  "New",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
];

describe("holiday", () => {
  it("returns a holiday name as a string", () => {
    expect(typeof holiday(new Date())).toBe("string");
  });
});

describe("easter", () => {
  it("falls in March or April", () => {
    for (const year of [2020, 2024, 2026, 2030, 2033]) {
      const feast = easter(year);
      expect(feast.month === 3 || feast.month === 4).toBe(true);
    }
  });
});

describe("moon", () => {
  it("returns one of the eight phase names", () => {
    expect(MOON_NAMES).toContain(moon(new Date()));
  });
});

describe("strike", () => {
  it("reports a numeric cuckoo count", () => {
    const decision = strike(8, 0, 0);
    expect(typeof decision.cuckooCount).toBe("number");
  });
});

describe("hands", () => {
  it("returns a numeric angle for each hand", () => {
    expect(typeof hourHand(4).angle).toBe("number");
    expect(typeof minuteHand(20).angle).toBe("number");
    expect(typeof secondHand(45).angle).toBe("number");
  });
});
