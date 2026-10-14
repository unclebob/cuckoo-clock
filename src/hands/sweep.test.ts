import { describe, expect, it } from "vitest";
import { hourHand } from "./hourHand";
import { minuteHand } from "./minuteHand";
import { secondHand } from "./secondHand";

describe("hands", () => {
  it("snaps instead of chasing a target that sits a hair behind", () => {
    expect(hourHand(0).angle).toBe(0);
    expect(hourHand(11.9999).angle).toBeGreaterThan(359.99);

    expect(minuteHand(0).angle).toBe(0);
    expect(minuteHand(59.999).angle).toBeGreaterThan(359.99);

    expect(secondHand(0).angle).toBe(0);
    expect(secondHand(59.999).angle).toBeGreaterThan(359.99);
  });
});
