import { describe, expect, it } from "vitest";
import {
  classifyRetryHealth,
  DEFAULT_RETRY_STATS,
  RETRY_STATS_STORAGE_KEY,
  normalizeRetryStats,
  readRetryStats,
  writeRetryStats,
} from "./retryStats";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
}

describe("retryStats utils", () => {
  it("normalizes invalid values to safe defaults", () => {
    const out = normalizeRetryStats({
      totalRetries: -2,
      recoveredLoads: "3",
      recoveredActions: "x",
      failedLoads: null,
      failedActions: 1.8,
      lastRetryAt: "bad",
    });
    expect(out).toEqual({
      totalRetries: 0,
      recoveredLoads: 3,
      recoveredActions: 0,
      failedLoads: 0,
      failedActions: 1,
      lastRetryAt: null,
    });
  });

  it("reads defaults when storage is empty", () => {
    const storage = createMemoryStorage();
    expect(readRetryStats(storage)).toEqual(DEFAULT_RETRY_STATS);
  });

  it("writes and reads persisted stats", () => {
    const storage = createMemoryStorage();
    writeRetryStats(
      {
        totalRetries: 4,
        recoveredLoads: 2,
        recoveredActions: 1,
        failedLoads: 0,
        failedActions: 1,
        lastRetryAt: 1234,
      },
      storage
    );
    expect(storage.getItem(RETRY_STATS_STORAGE_KEY)).toContain("\"totalRetries\":4");
    expect(readRetryStats(storage)).toEqual({
      totalRetries: 4,
      recoveredLoads: 2,
      recoveredActions: 1,
      failedLoads: 0,
      failedActions: 1,
      lastRetryAt: 1234,
    });
  });

  it("classifies health as healthy / warning / critical", () => {
    expect(classifyRetryHealth(DEFAULT_RETRY_STATS)).toMatchObject({
      level: "healthy",
      label: "Estable",
    });

    expect(
      classifyRetryHealth({
        ...DEFAULT_RETRY_STATS,
        totalRetries: 7,
      })
    ).toMatchObject({
      level: "warning",
      label: "Alerta",
    });

    expect(
      classifyRetryHealth({
        ...DEFAULT_RETRY_STATS,
        failedLoads: 2,
        failedActions: 1,
      })
    ).toMatchObject({
      level: "critical",
      label: "Critico",
    });
  });
});
