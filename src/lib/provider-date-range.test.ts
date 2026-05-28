import { describe, expect, it } from "vitest";
import { parseRangeFromApi, toRangeQuery } from "./provider-date-range";

describe("provider date ranges", () => {
  it("serializes local calendar dates without UTC conversion", () => {
    const query = toRangeQuery({
      from: new Date(2026, 4, 28, 0, 0, 0, 0),
      to: new Date(2026, 4, 30, 23, 59, 59, 999),
    });

    expect(query).toEqual({ from: "2026-05-28", to: "2026-05-30" });
  });

  it("parses API date-only strings as local calendar dates", () => {
    const range = parseRangeFromApi("2026-05-28", "2026-05-30");

    expect(range.from.getFullYear()).toBe(2026);
    expect(range.from.getMonth()).toBe(4);
    expect(range.from.getDate()).toBe(28);
    expect(range.from.getHours()).toBe(0);
    expect(range.to.getFullYear()).toBe(2026);
    expect(range.to.getMonth()).toBe(4);
    expect(range.to.getDate()).toBe(30);
    expect(range.to.getHours()).toBe(23);
  });
});
