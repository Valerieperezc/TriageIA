import { describe, expect, it } from "vitest";
import { escapeCsvCell, getAuditHistoryExportFilename, toCsvString } from "./csv";

describe("escapeCsvCell", () => {
  it("returns empty for nullish", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("wraps when comma or quote", () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
  });
});

describe("getAuditHistoryExportFilename", () => {
  it("uses ISO date prefix", () => {
    expect(getAuditHistoryExportFilename(new Date("2026-06-01T00:00:00.000Z"))).toBe(
      "triageia-auditoria-2026-06-01.csv"
    );
  });
});

describe("toCsvString", () => {
  it("builds csv with headers and rows", () => {
    const s = toCsvString(
      ["A", "B"],
      [
        ["1", "2"],
        ["x,y", "z"],
      ]
    );
    expect(s).toContain("A,B");
    expect(s).toContain('"x,y",z');
  });
});
