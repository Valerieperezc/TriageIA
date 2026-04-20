import { describe, expect, it } from "vitest";
import { buildPatientsCsv } from "./patientCsv";

describe("buildPatientsCsv", () => {
  it("includes header and one row", () => {
    const now = 1_000_000_000_000;
    const csv = buildPatientsCsv(
      [
        {
          name: "Test",
          age: 30,
          symptom: "X",
          temp: 37,
          fc: 80,
          triage: "III",
          status: "En espera",
          createdAt: now - 10 * 60_000,
          arrivedAt: now - 10 * 60_000,
          fastTrack: false,
        },
      ],
      now
    );
    expect(csv).toContain("Nombre");
    expect(csv).toContain("Test");
    expect(csv).toContain("10");
  });
});
