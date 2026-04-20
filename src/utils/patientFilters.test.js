import { describe, expect, it } from "vitest";
import { filterPatients } from "./patientFilters";

const sample = [
  { id: "1", name: "Ana López", symptom: "Fiebre", triage: "I" },
  { id: "2", name: "Ben Ruiz", symptom: "Dolor", triage: "II" },
  { id: "3", name: "Carlos Ana", symptom: "Tos", triage: "III" },
];

describe("filterPatients", () => {
  it("returns all when no filters", () => {
    expect(filterPatients(sample, {})).toHaveLength(3);
  });

  it("filters by triage", () => {
    expect(filterPatients(sample, { triage: "I" })).toHaveLength(1);
    expect(filterPatients(sample, { triage: "I" })[0].name).toBe("Ana López");
  });

  it("filters by name substring", () => {
    const r = filterPatients(sample, { search: "ana" });
    expect(r).toHaveLength(2);
  });

  it("filters by symptom substring", () => {
    const r = filterPatients(sample, { search: "fiebre" });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("1");
  });

  it("combines triage and search", () => {
    const r = filterPatients(sample, { triage: "III", search: "carlos" });
    expect(r).toHaveLength(1);
  });
});
