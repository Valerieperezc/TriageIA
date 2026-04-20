import { describe, expect, it } from "vitest";
import { retryAsync } from "./retry";

describe("retryAsync", () => {
  it("returns result on first successful attempt", async () => {
    const result = await retryAsync(async () => "ok");
    expect(result).toBe("ok");
  });

  it("retries and eventually resolves", async () => {
    let attempts = 0;
    const result = await retryAsync(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("temporary failure");
        }
        return "done";
      },
      { delaysMs: [0, 0] }
    );

    expect(result).toBe("done");
    expect(attempts).toBe(3);
  });

  it("stops when shouldRetry returns false", async () => {
    let attempts = 0;
    await expect(
      retryAsync(
        async () => {
          attempts += 1;
          throw new Error("fatal");
        },
        {
          delaysMs: [0, 0],
          shouldRetry: () => false,
        }
      )
    ).rejects.toThrow("fatal");

    expect(attempts).toBe(1);
  });

  it("throws the last error after exhausting attempts", async () => {
    let attempts = 0;
    await expect(
      retryAsync(
        async () => {
          attempts += 1;
          throw new Error("still failing");
        },
        { delaysMs: [0, 0] }
      )
    ).rejects.toThrow("still failing");

    expect(attempts).toBe(3);
  });

  it("calls onRetry for each scheduled retry", async () => {
    let attempts = 0;
    const retryCalls = [];

    await expect(
      retryAsync(
        async () => {
          attempts += 1;
          throw new Error("boom");
        },
        {
          delaysMs: [0, 0],
          onRetry: (_error, attempt, totalAttempts) => {
            retryCalls.push({ attempt, totalAttempts });
          },
        }
      )
    ).rejects.toThrow("boom");

    expect(attempts).toBe(3);
    expect(retryCalls).toEqual([
      { attempt: 1, totalAttempts: 3 },
      { attempt: 2, totalAttempts: 3 },
    ]);
  });
});
