import { describe, expect, it } from "vitest";
import { CTAS_LEVELS, CTAS_LEVEL_INFO, getCtasLevelInfo } from "./ctasProtocol";

describe("CTAS_LEVEL_INFO", () => {
  it("defines urgency message for every level", () => {
    for (const level of CTAS_LEVELS) {
      const info = getCtasLevelInfo(level);
      expect(info).toBeTruthy();
      expect(info.urgencyMessage.length).toBeGreaterThan(5);
      expect(info.badgeClass).toMatch(/^badge-/);
    }
  });

  it("uses immediate attention for CTAS I", () => {
    expect(CTAS_LEVEL_INFO.I.urgencyMessage).toMatch(/inmediata/i);
    expect(CTAS_LEVEL_INFO.I.waitMinutes).toBe(0);
  });

  it("uses 15 minutes for CTAS II", () => {
    expect(CTAS_LEVEL_INFO.II.urgencyMessage).toMatch(/15/);
    expect(CTAS_LEVEL_INFO.II.waitMinutes).toBe(15);
  });
});
