import { describe, expect, it } from "vitest";
import { parseSortParam, sortPatients } from "./patientSort";

const now = 1_000_000_000_000;

describe("parseSortParam", () => {
  it("defaults invalid to triage", () => {
    expect(parseSortParam(null)).toBe("triage");
    expect(parseSortParam("x")).toBe("triage");
  });

  it("accepts valid modes", () => {
    expect(parseSortParam("wait-desc")).toBe("wait-desc");
    expect(parseSortParam("name")).toBe("name");
  });
});

describe("sortPatients", () => {
  const a = {
    id: "1",
    name: "Ana",
    triage: "III",
    createdAt: now - 60 * 60_000,
  };
  const b = {
    id: "2",
    name: "Ben",
    triage: "I",
    createdAt: now - 10 * 60_000,
  };
  const c = {
    id: "3",
    name: "Cruz",
    triage: "I",
    createdAt: now - 30 * 60_000,
  };

  it("triage: I first, then longer wait within same level", () => {
    const r = sortPatients([a, b, c], "triage", now);
    expect(r.map((p) => p.id)).toEqual(["3", "2", "1"]);
  });

  it("wait-desc: longest wait first", () => {
    const r = sortPatients([a, b, c], "wait-desc", now);
    expect(r[0].id).toBe("1");
  });

  it("name: alphabetical", () => {
    const r = sortPatients([b, a, c], "name", now);
    expect(r.map((p) => p.name)).toEqual(["Ana", "Ben", "Cruz"]);
  });
});
