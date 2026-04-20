import { beforeEach, describe, expect, it } from "vitest";
import {
  createAuditEvent,
  createPatient,
  fetchAuditEvents,
  fetchPatients,
  updatePatientStatus,
} from "./triageService";

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
    clear() {
      map.clear();
    },
  };
}

describe("triageService local fallback", () => {
  beforeEach(() => {
    globalThis.localStorage = createMemoryStorage();
  });

  it("creates and fetches patients ordered by recency", async () => {
    const first = await createPatient({
      name: "Ana",
      age: 30,
      symptom: "Dolor",
      temp: 37.5,
      fc: 90,
      triage: "III",
      status: "En espera",
    });
    const second = await createPatient({
      name: "Bruno",
      age: 25,
      symptom: "Fiebre",
      temp: 39.2,
      fc: 120,
      triage: "I",
      status: "En espera",
    });

    const list = await fetchPatients();
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(second.id);
    expect(list[1].id).toBe(first.id);
  });

  it("updates patient status in local storage", async () => {
    const patient = await createPatient({
      name: "Carla",
      age: 50,
      symptom: "Taquicardia",
      temp: 37.8,
      fc: 130,
      triage: "I",
      status: "En espera",
    });

    await updatePatientStatus(patient.id, "En atención");
    const list = await fetchPatients();

    expect(list[0].status).toBe("En atención");
  });

  it("stores and fetches audit events", async () => {
    await createAuditEvent({
      patient_id: "p-1",
      patient_name: "Paciente X",
      action: "Paciente creado",
      triage: "II",
      actor_email: "admin@triage.com",
    });

    const events = await fetchAuditEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      name: "Paciente X",
      action: "Paciente creado",
      triage: "II",
    });
  });

  it("returns local audit events sorted by recency (including legacy rows)", async () => {
    const now = Date.now();
    localStorage.setItem(
      "triageia:events",
      JSON.stringify([
        {
          name: "Legacy",
          action: "Antiguo",
          triage: "III",
          date: new Date(now - 10_000).toLocaleString(),
        },
        {
          name: "Moderno",
          action: "Nuevo",
          triage: "I",
          createdAt: now,
          date: new Date(now).toLocaleString(),
        },
      ])
    );

    const events = await fetchAuditEvents();
    expect(events[0].name).toBe("Moderno");
    expect(events[1].name).toBe("Legacy");
  });

  it("deduplicates audit events by request_id in local mode", async () => {
    await createAuditEvent({
      patient_id: "p-1",
      patient_name: "Paciente Y",
      action: "Estado: Finalizado",
      triage: "I",
      request_id: "req-123",
    });
    await createAuditEvent({
      patient_id: "p-1",
      patient_name: "Paciente Y",
      action: "Estado: Finalizado",
      triage: "I",
      request_id: "req-123",
    });

    const events = await fetchAuditEvents();
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe("Estado: Finalizado");
  });

  it("keeps local patient creation idempotent when id is reused", async () => {
    const payload = {
      id: "patient-1",
      name: "Paciente Z",
      age: 41,
      symptom: "Dolor torácico",
      temp: 38.1,
      fc: 112,
      triage: "I",
      status: "En espera",
    };

    const first = await createPatient(payload);
    const second = await createPatient(payload);
    const list = await fetchPatients();

    expect(first.id).toBe("patient-1");
    expect(second.id).toBe("patient-1");
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Paciente Z");
  });
});
