import { describe, expect, it } from "vitest";
import { calculateTriage, meanArterialPressure } from "./triage";

describe("meanArterialPressure", () => {
  it("PAM = (PAS + 2×PAD) / 3", () => {
    expect(meanArterialPressure(120, 80)).toBeCloseTo(93.33, 1);
    expect(meanArterialPressure(84, 55)).toBeCloseTo(64.67, 1);
  });
});

describe("calculateTriage (CTAS I–V)", () => {
  it("I: alteración de conciencia", () => {
    expect(calculateTriage(36.5, 80, { alteredConsciousness: true })).toBe("I");
  });

  it("I: hipoxemia grave (SpO2)", () => {
    expect(calculateTriage(36.5, 80, { spo2: 85 })).toBe("I");
  });

  it("I: fiebre muy alta o taquicardia extrema", () => {
    expect(calculateTriage(41, 90)).toBe("I");
    expect(calculateTriage(38, 160)).toBe("I");
  });

  it("I: dolor EVA muy alto", () => {
    expect(calculateTriage(36.5, 80, { pain: 9 })).toBe("I");
  });

  it("II: fiebre alta o taquicardia sin criterio de I", () => {
    expect(calculateTriage(39.2, 95)).toBe("II");
    expect(calculateTriage(37, 135)).toBe("II");
  });

  it("II: SpO2 limítrofe", () => {
    expect(calculateTriage(36.5, 80, { spo2: 92 })).toBe("II");
  });

  it("III: fiebre moderada o FC elevada", () => {
    expect(calculateTriage(38.4, 100)).toBe("III");
  });

  it("IV: signos leves", () => {
    expect(calculateTriage(37.8, 105)).toBe("IV");
  });

  it("V: estable", () => {
    expect(calculateTriage(37.2, 90)).toBe("V");
  });

  it("I: taquipnea severa (FR)", () => {
    expect(
      calculateTriage(36.5, 80, {
        respiratoryRate: 42,
        bpSystolic: 120,
        bpDiastolic: 80,
      })
    ).toBe("I");
  });

  it("II: taquipnea moderada (FR 30–39)", () => {
    expect(
      calculateTriage(36.5, 80, {
        respiratoryRate: 32,
        bpSystolic: 120,
        bpDiastolic: 80,
      })
    ).toBe("II");
  });

  it("I: hipoperfusión por PAM baja", () => {
    expect(
      calculateTriage(36.5, 80, {
        respiratoryRate: 16,
        bpSystolic: 84,
        bpDiastolic: 55,
      })
    ).toBe("I");
  });

  it("II: PAM límite baja (65–75)", () => {
    expect(
      calculateTriage(36.5, 80, {
        respiratoryRate: 16,
        bpSystolic: 100,
        bpDiastolic: 55,
      })
    ).toBe("II");
  });

  it("I: PAM muy elevada", () => {
    expect(
      calculateTriage(36.5, 80, {
        respiratoryRate: 16,
        bpSystolic: 200,
        bpDiastolic: 110,
      })
    ).toBe("I");
  });
});
