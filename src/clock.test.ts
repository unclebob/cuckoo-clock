import { describe, expect, it } from "vitest";
import { easter } from "./calendar/easter";
import { holiday } from "./calendar/holiday";
import { moon } from "./calendar/moon";
import { presidentsDay } from "./calendar/presidentsDay";
import { thanksgiving } from "./calendar/thanksgiving";
import { chapterMark, nextMotion } from "./face/dial";
import { hourHand } from "./hands/hourHand";
import { minuteHand } from "./hands/minuteHand";
import { secondHand } from "./hands/secondHand";
import { pendulum } from "./motion/pendulum";
import { strike } from "./strike/strike";
import { advance, clockMoved, sameTime, steppedOrRead } from "./time/advance";

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

function at(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day);
}

function dayInMonth(year: number, monthIndex: number, accepts: (day: number) => boolean): number {
  for (let day = 1; day <= 31; day += 1) {
    if (accepts(day)) {
      return day;
    }
  }
  throw new Error(`no matching day in ${year}-${monthIndex + 1}`);
}

describe("holiday", () => {
  it("names the five holidays and leaves every other day blank", () => {
    expect(holiday(at(2026, 11, 25))).toBe("Christmas");
    expect(holiday(at(2026, 11, 24))).toBe("Christmas Eve");
    expect(holiday(at(2026, 11, 1))).toBe("");
    const thanksgivingDay = dayInMonth(2026, 10, (day) => thanksgiving(2026, 11, day));
    expect(at(2026, 10, thanksgivingDay).getDay()).toBe(4);
    expect(thanksgivingDay).toBeGreaterThanOrEqual(22);
    expect(thanksgivingDay).toBeLessThanOrEqual(28);
    expect(holiday(at(2026, 10, thanksgivingDay))).toBe("Thanksgiving");
    expect(holiday(at(2026, 10, 1))).toBe("");
    const presidents = dayInMonth(2026, 1, (day) => presidentsDay(2026, 2, day));
    expect(at(2026, 1, presidents).getDay()).toBe(1);
    expect(presidents).toBeGreaterThanOrEqual(15);
    expect(presidents).toBeLessThanOrEqual(21);
    expect(holiday(at(2026, 1, presidents))).toBe("Presidents Day");
    expect(holiday(at(2026, 1, 1))).toBe("");
    const feast = easter(2026);
    expect(holiday(at(2026, feast.month - 1, feast.day))).toBe("Easter");
    const otherDay = feast.day === 1 ? 2 : 1;
    expect(holiday(at(2026, feast.month - 1, otherDay))).toBe("");
    expect(holiday(at(2026, 5, 15))).toBe("");
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
    const start = Date.UTC(1999, 11, 1);
    for (let step = 0; step < 80; step += 1) {
      const when = new Date(start + step * 12 * 60 * 60 * 1000);
      expect(MOON_NAMES).toContain(moon(when));
    }
    expect(MOON_NAMES).toContain(moon(new Date()));
  });
});

describe("strike", () => {
  it("stays quiet until a new quarter arrives, then counts the chimes", () => {
    expect(strike(10, 15, 0)).toEqual({ chimeCount: 0, cuckooCount: 0 });
    expect(strike(10, 15, 0)).toEqual({ chimeCount: 0, cuckooCount: 0 });
    expect(strike(10, 15, 1)).toEqual({ chimeCount: 0, cuckooCount: 0 });
    expect(strike(10, 15, 0)).toEqual({ chimeCount: 1, cuckooCount: 0 });
    expect(strike(10, 30, 0)).toEqual({ chimeCount: 2, cuckooCount: 0 });
    expect(strike(10, 45, 0)).toEqual({ chimeCount: 3, cuckooCount: 0 });
    expect(strike(11, 0, 0)).toEqual({ chimeCount: 4, cuckooCount: 11 });
    expect(strike(12, 0, 0)).toEqual({ chimeCount: 4, cuckooCount: 12 });
    expect(strike(0, 0, 0)).toEqual({ chimeCount: 4, cuckooCount: 12 });
    expect(strike(13, 1, 0)).toEqual({ chimeCount: 0, cuckooCount: 0 });
    expect(typeof strike(8, 0, 0).cuckooCount).toBe("number");
  });
});

describe("advance", () => {
  it("rolls the second, the minute, and the hour", () => {
    expect(advance(1, 2, 3)).toEqual({ hour: 1, minute: 2, second: 4 });
    expect(advance(1, 2, 59)).toEqual({ hour: 1, minute: 3, second: 0 });
    expect(advance(1, 59, 59)).toEqual({ hour: 2, minute: 0, second: 0 });
    expect(advance(23, 59, 59)).toEqual({ hour: 0, minute: 0, second: 0 });
  });

  it("tells a one-second step from a jumped reading", () => {
    const shown = { hour: 1, minute: 2, second: 3 };
    const same = { hour: 1, minute: 2, second: 3 };
    expect(sameTime(shown, same)).toBe(true);
    expect(sameTime(shown, { hour: 2, minute: 2, second: 3 })).toBe(false);
    expect(sameTime(shown, { hour: 1, minute: 9, second: 3 })).toBe(false);
    expect(sameTime(shown, { hour: 1, minute: 2, second: 9 })).toBe(false);
    expect(clockMoved(shown, same)).toBe(false);
    expect(clockMoved(shown, { hour: 1, minute: 2, second: 4 })).toBe(true);
    expect(clockMoved(shown, { hour: 1, minute: 3, second: 3 })).toBe(true);
    expect(clockMoved(shown, { hour: 4, minute: 2, second: 3 })).toBe(true);
    expect(steppedOrRead(shown, { hour: 1, minute: 2, second: 4 })).toEqual({
      hour: 1,
      minute: 2,
      second: 4,
    });
    expect(steppedOrRead(shown, { hour: 1, minute: 2, second: 8 })).toEqual({
      hour: 1,
      minute: 2,
      second: 8,
    });
    expect(steppedOrRead({ hour: 1, minute: 2, second: 59 }, { hour: 1, minute: 3, second: 0 })).toEqual({
      hour: 1,
      minute: 3,
      second: 0,
    });
  });
});

describe("pendulum", () => {
  it("tics at the left end, toks at the right end, and stays quiet in between", () => {
    expect(pendulum(1500).beat).toBe("tic");
    expect(pendulum(1500).beat).toBe("");
    expect(pendulum(0).beat).toBe("");
    expect(pendulum(500).beat).toBe("tok");
    expect(pendulum(500).beat).toBe("");
    const swung = pendulum(-100);
    expect(swung.beat).toBe("");
    expect(typeof swung.angle).toBe("number");
    expect(swung.transform).toContain("rotate(");
  });
});

describe("hands", () => {
  it("returns a numeric angle for each hand", () => {
    expect(typeof hourHand(4).angle).toBe("number");
    expect(typeof hourHand(5).angle).toBe("number");
    expect(typeof minuteHand(20).angle).toBe("number");
    expect(typeof minuteHand(21).angle).toBe("number");
    expect(typeof secondHand(45).angle).toBe("number");
    expect(typeof secondHand(46).angle).toBe("number");
  });
});

describe("dial", () => {
  it("picks the long chapter marks", () => {
    expect(chapterMark(0)).toEqual({ inner: 124, stroke: "#5c4318", width: "2.4" });
    expect(chapterMark(1)).toEqual({ inner: 136, stroke: "#8a7040", width: "1" });
  });

  it("eases the doors and opens the beak only while the bird sings", () => {
    const closed = nextMotion(0, 0, 0, 0, false, 0);
    expect(closed.doorOpenness).toBe(0);
    expect(closed.beakOpen).toBe("0");
    expect(closed.beakClosed).toBe("1");

    const opening = nextMotion(0, 1, 0, 76, false, 0);
    expect(opening.doorOpenness).toBeCloseTo(0.14);
    expect(opening.birdDrop).toBeCloseTo(76 * 0.16);

    const singing = nextMotion(0, 0, 0, 0, true, 0);
    expect(singing.beakOpen).toBe("1");
    expect(singing.beakClosed).toBe("0");
    expect(singing.birdTransform).toContain("rotate(0)");

    const quietBeak = nextMotion(0, 0, 0, 0, true, 730);
    expect(quietBeak.beakOpen).toBe("0");
    expect(quietBeak.beakClosed).toBe("1");
    expect(quietBeak.birdTransform).not.toContain("rotate(0)");
  });
});
