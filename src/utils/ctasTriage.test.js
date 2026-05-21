import { describe, expect, it } from "vitest";
import {
  isUndertriage,
  suggestCtasLevel,
  validateTriageAssignment,
} from "./ctasTriage";

describe("suggestCtasLevel", () => {
  const vitals = {
    temp: 37,
    fc: 80,
    vitals: {
      respiratoryRate: 16,
      bpSystolic: 120,
      bpDiastolic: 80,
    },
  };

  it("uses most urgent of complaint, vitals and flags", () => {
    const r = suggestCtasLevel({
      chiefComplaintCode: "non_urgent",
      redFlags: [],
      ...vitals,
    });
    expect(r.level).toBe("V");
  });

  it("escalates with cardiac chest pain presentation", () => {
    const r = suggestCtasLevel({
      chiefComplaintCode: "cardiac_chest_pain",
      redFlags: [],
      ...vitals,
    });
    expect(r.level).toBe("II");
  });

  it("fast track raises minimum urgency", () => {
    const r = suggestCtasLevel({
      chiefComplaintCode: "other",
      redFlags: [],
      fastTrack: true,
      ...vitals,
    });
    expect(["I", "II"]).toContain(r.level);
  });
});

describe("validateTriageAssignment", () => {
  it("allows same level without reason", () => {
    expect(
      validateTriageAssignment({ suggested: "II", assigned: "II" }).valid
    ).toBe(true);
  });

  it("blocks undertriage without reason", () => {
    const r = validateTriageAssignment({ suggested: "II", assigned: "IV" });
    expect(r.valid).toBe(false);
  });

  it("allows undertriage with reason code", () => {
    const r = validateTriageAssignment({
      suggested: "II",
      assigned: "IV",
      overrideReasonCode: "clinical_judgment",
    });
    expect(r.valid).toBe(true);
  });
});

describe("isUndertriage", () => {
  it("detects less urgent assignment", () => {
    expect(isUndertriage("I", "III")).toBe(true);
    expect(isUndertriage("III", "I")).toBe(false);
  });
});
