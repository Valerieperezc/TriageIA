import { describe, expect, it } from "vitest";
import { paginateSlice } from "./pagination";

describe("paginateSlice", () => {
  const items = [1, 2, 3, 4, 5];

  it("first page", () => {
    const r = paginateSlice(items, 1, 2);
    expect(r.rows).toEqual([1, 2]);
    expect(r.totalPages).toBe(3);
    expect(r.rangeStart).toBe(1);
    expect(r.rangeEnd).toBe(2);
  });

  it("clamps page above totalPages", () => {
    const r = paginateSlice(items, 99, 2);
    expect(r.pageNum).toBe(3);
    expect(r.rows).toEqual([5]);
  });

  it("empty list", () => {
    const r = paginateSlice([], 1, 10);
    expect(r.rows).toEqual([]);
    expect(r.totalPages).toBe(1);
    expect(r.rangeStart).toBe(0);
  });
});
