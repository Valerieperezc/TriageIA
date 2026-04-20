import { describe, expect, it } from "vitest";
import {
  computeQueueMetrics,
  filterPatientsOfDay,
  isSameLocalDay,
  minutesSince,
  minutesWaiting,
  startOfLocalDay,
  waitReferenceMs,
} from "./dashboardMetrics";

describe("minutesSince", () => {
  it("computes whole minutes", () => {
    expect(minutesSince(0, 120_000)).toBe(2);
  });
});

describe("waitReferenceMs / minutesWaiting", () => {
  const now = 1_000_000_000_000;

  it("usa llegada si existe", () => {
    const p = {
      createdAt: now - 5 * 60_000,
      arrivedAt: now - 20 * 60_000,
    };
    expect(waitReferenceMs(p)).toBe(now - 20 * 60_000);
    expect(minutesWaiting(p, now)).toBe(20);
  });
});

describe("computeQueueMetrics", () => {
  const now = 1_000_000_000_000;

  it("returns zeros for empty list", () => {
    const m = computeQueueMetrics([], now);
    expect(m.waitingCount).toBe(0);
    expect(m.avgWaitMinutes).toBe(0);
    expect(m.criticalInQueueCount).toBe(0);
  });

  it("averages wait for En espera only", () => {
    const patients = [
      {
        status: "En espera",
        triage: "III",
        createdAt: now - 20 * 60_000,
      },
      {
        status: "En espera",
        triage: "III",
        createdAt: now - 40 * 60_000,
      },
      { status: "Finalizado", triage: "I", createdAt: now - 999 * 60_000 },
    ];
    const m = computeQueueMetrics(patients, now);
    expect(m.waitingCount).toBe(2);
    expect(m.avgWaitMinutes).toBe(30);
    expect(m.longestWaitMinutes).toBe(40);
  });

  it("counts critical in queue", () => {
    const patients = [
      { status: "En espera", triage: "I", createdAt: now - 15 * 60_000 },
      { status: "En espera", triage: "II", createdAt: now - 10 * 60_000 },
    ];
    const m = computeQueueMetrics(patients, now);
    expect(m.criticalInQueueCount).toBe(1);
    expect(m.longestCriticalWaitMinutes).toBe(15);
  });
});

describe("startOfLocalDay / isSameLocalDay", () => {
  it("startOfLocalDay normaliza a 00:00 local", () => {
    const ref = new Date(2026, 3, 20, 15, 42, 10).getTime();
    const expected = new Date(2026, 3, 20, 0, 0, 0, 0).getTime();
    expect(startOfLocalDay(ref)).toBe(expected);
  });

  it("isSameLocalDay reconoce mismo día aunque cambie la hora", () => {
    const morning = new Date(2026, 3, 20, 8, 0, 0).getTime();
    const night = new Date(2026, 3, 20, 23, 59, 0).getTime();
    expect(isSameLocalDay(morning, night)).toBe(true);
  });

  it("isSameLocalDay distingue días consecutivos", () => {
    const today = new Date(2026, 3, 20, 10, 0, 0).getTime();
    const yesterday = new Date(2026, 3, 19, 23, 59, 0).getTime();
    expect(isSameLocalDay(today, yesterday)).toBe(false);
  });

  it("isSameLocalDay devuelve false para valores no numéricos", () => {
    expect(isSameLocalDay(undefined, Date.now())).toBe(false);
    expect(isSameLocalDay(NaN, Date.now())).toBe(false);
  });
});

describe("filterPatientsOfDay", () => {
  const now = new Date(2026, 3, 20, 10, 0, 0).getTime();
  const yesterday = new Date(2026, 3, 19, 10, 0, 0).getTime();
  const earlierToday = new Date(2026, 3, 20, 1, 0, 0).getTime();
  const lateToday = new Date(2026, 3, 20, 23, 30, 0).getTime();

  it("incluye solo pacientes cuya llegada/registro es del día actual", () => {
    const patients = [
      { id: "a", createdAt: earlierToday, arrivedAt: earlierToday },
      { id: "b", createdAt: lateToday, arrivedAt: null },
      { id: "c", createdAt: yesterday, arrivedAt: yesterday },
    ];
    const result = filterPatientsOfDay(patients, now);
    expect(result.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("usa arrivedAt por encima de createdAt cuando existe", () => {
    const patients = [
      { id: "a", createdAt: yesterday, arrivedAt: earlierToday },
      { id: "b", createdAt: earlierToday, arrivedAt: yesterday },
    ];
    const result = filterPatientsOfDay(patients, now);
    expect(result.map((p) => p.id)).toEqual(["a"]);
  });

  it("retorna lista vacía si no hay coincidencias", () => {
    const patients = [
      { id: "x", createdAt: yesterday, arrivedAt: yesterday },
    ];
    expect(filterPatientsOfDay(patients, now)).toEqual([]);
  });
});
