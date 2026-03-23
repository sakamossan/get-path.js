import { describe, test, expect } from "vitest";
import { dateVars } from "../src/date-vars";

describe("dateVars", () => {
  test("formats known date correctly", () => {
    const date = new Date(2026, 2, 22); // 2026-03-22 (month is 0-indexed)
    const vars = dateVars(date);

    expect(vars.YYYY).toBe("2026");
    expect(vars.YY).toBe("26");
    expect(vars.MM).toBe("03");
    expect(vars.DD).toBe("22");
    expect(vars.EEE).toBe("Sun");
  });

  test("pads single-digit month and day", () => {
    const date = new Date(2026, 0, 5); // 2026-01-05
    const vars = dateVars(date);

    expect(vars.MM).toBe("01");
    expect(vars.DD).toBe("05");
  });

  test("WW returns ISO week number", () => {
    const date = new Date(2026, 0, 1); // 2026-01-01
    const vars = dateVars(date);
    expect(vars.WW).toBe("01");
  });
});
