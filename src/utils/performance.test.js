import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPostLoginPerfHistory,
  consumePostLoginNavigationMs,
  formatPostLoginPerfCsv,
  getPostLoginPerfExportFilename,
  markPostLoginNavigationStart,
  POST_LOGIN_PERF_HISTORY_STORAGE_KEY,
  readPostLoginPerfHistory,
  readPostLoginPerfSummary,
  recordPostLoginNavigationMs,
  shouldPrefetchPrivateAreaOnCurrentConnection,
} from "./performance";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("performance utils", () => {
  it("exports stable localStorage key for post-login perf history", () => {
    expect(POST_LOGIN_PERF_HISTORY_STORAGE_KEY).toBe("triageia:perf:post-login-history");
  });

  it("marks and consumes post-login navigation time", () => {
    const storage = createMemoryStorage();
    let now = 100;
    vi.stubGlobal("sessionStorage", storage);
    vi.stubGlobal("performance", {
      now: () => now,
    });

    markPostLoginNavigationStart();
    now = 340;
    expect(consumePostLoginNavigationMs()).toBe(240);
    expect(consumePostLoginNavigationMs()).toBeNull();
  });

  it("returns null when timing cannot be read", () => {
    vi.stubGlobal("sessionStorage", undefined);
    vi.stubGlobal("performance", undefined);
    expect(consumePostLoginNavigationMs()).toBeNull();
  });

  it("prefetches by default when connection API is unavailable", () => {
    vi.stubGlobal("navigator", {});
    expect(shouldPrefetchPrivateAreaOnCurrentConnection()).toBe(true);
  });

  it("skips prefetch on constrained networks", () => {
    vi.stubGlobal("navigator", {
      connection: { saveData: true },
    });
    expect(shouldPrefetchPrivateAreaOnCurrentConnection()).toBe(false);

    vi.stubGlobal("navigator", {
      connection: { effectiveType: "2g", saveData: false },
    });
    expect(shouldPrefetchPrivateAreaOnCurrentConnection()).toBe(false);

    vi.stubGlobal("navigator", {
      connection: { effectiveType: "4g", downlink: 0.5, saveData: false },
    });
    expect(shouldPrefetchPrivateAreaOnCurrentConnection()).toBe(false);
  });

  it("allows prefetch on good connections", () => {
    vi.stubGlobal("navigator", {
      connection: { effectiveType: "4g", downlink: 10, saveData: false },
    });
    expect(shouldPrefetchPrivateAreaOnCurrentConnection()).toBe(true);
  });

  it("stores and summarizes post-login navigation history", () => {
    const storage = createMemoryStorage();
    recordPostLoginNavigationMs(120, storage);
    recordPostLoginNavigationMs(80, storage);
    recordPostLoginNavigationMs(100, storage);

    expect(readPostLoginPerfSummary(storage)).toEqual({
      lastMs: 100,
      avgMs: 100,
      samples: 3,
    });
  });

  it("clears persisted post-login history", () => {
    const storage = createMemoryStorage();
    recordPostLoginNavigationMs(150, storage);
    expect(readPostLoginPerfHistory(storage)).toEqual([150]);

    clearPostLoginPerfHistory(storage);
    expect(readPostLoginPerfHistory(storage)).toEqual([]);
    expect(readPostLoginPerfSummary(storage)).toEqual({
      lastMs: null,
      avgMs: null,
      samples: 0,
    });
  });

  it("formats post-login perf CSV or returns null when empty", () => {
    expect(formatPostLoginPerfCsv([])).toBeNull();
    expect(formatPostLoginPerfCsv(null)).toBeNull();
    const csv = formatPostLoginPerfCsv([88, 102]);
    expect(csv).toMatch(/^\uFEFF/);
    expect(csv).toContain("Muestra");
    expect(csv).toContain("88");
    expect(csv).toContain("102");
  });

  it("builds dated filename for post-login perf export", () => {
    expect(getPostLoginPerfExportFilename(new Date("2026-04-14T12:00:00.000Z"))).toBe(
      "triageia-ux-post-login-2026-04-14.csv"
    );
  });
});
