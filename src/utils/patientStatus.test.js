import { describe, expect, it } from "vitest";
import {
  assertAllowedClientStatus,
  assertValidStatusTransition,
  canTransitionStatus,
  isTerminalStatus,
  PATIENT_STATUS,
} from "./patientStatus";

describe("assertAllowedClientStatus", () => {
  it("acepta transiciones válidas", () => {
    expect(() => assertAllowedClientStatus("En atención")).not.toThrow();
    expect(() => assertAllowedClientStatus("Finalizado")).not.toThrow();
  });

  it("rechaza otros valores", () => {
    expect(() => assertAllowedClientStatus("En espera")).toThrow();
    expect(() => assertAllowedClientStatus("Otro")).toThrow();
  });
});

describe("canTransitionStatus", () => {
  it("permite pasar de En espera a En atención", () => {
    expect(canTransitionStatus(PATIENT_STATUS.WAITING, PATIENT_STATUS.IN_ATTENTION)).toBe(true);
  });

  it("permite pasar de En espera a Finalizado (abandono)", () => {
    expect(canTransitionStatus(PATIENT_STATUS.WAITING, PATIENT_STATUS.FINALIZED)).toBe(true);
  });

  it("permite pasar de En atención a Finalizado", () => {
    expect(canTransitionStatus(PATIENT_STATUS.IN_ATTENTION, PATIENT_STATUS.FINALIZED)).toBe(true);
  });

  it("no permite reabrir un paciente finalizado", () => {
    expect(canTransitionStatus(PATIENT_STATUS.FINALIZED, PATIENT_STATUS.IN_ATTENTION)).toBe(false);
    expect(canTransitionStatus(PATIENT_STATUS.FINALIZED, PATIENT_STATUS.WAITING)).toBe(false);
    expect(canTransitionStatus(PATIENT_STATUS.FINALIZED, PATIENT_STATUS.FINALIZED)).toBe(false);
  });

  it("no permite retroceder de En atención a En espera", () => {
    expect(canTransitionStatus(PATIENT_STATUS.IN_ATTENTION, PATIENT_STATUS.WAITING)).toBe(false);
  });

  it("rechaza estados desconocidos", () => {
    expect(canTransitionStatus("Inexistente", PATIENT_STATUS.IN_ATTENTION)).toBe(false);
    expect(canTransitionStatus(PATIENT_STATUS.WAITING, "Inexistente")).toBe(false);
  });
});

describe("assertValidStatusTransition", () => {
  it("no lanza en transiciones válidas", () => {
    expect(() =>
      assertValidStatusTransition(PATIENT_STATUS.WAITING, PATIENT_STATUS.IN_ATTENTION)
    ).not.toThrow();
    expect(() =>
      assertValidStatusTransition(PATIENT_STATUS.IN_ATTENTION, PATIENT_STATUS.FINALIZED)
    ).not.toThrow();
  });

  it("da mensaje específico al intentar reabrir un paciente finalizado", () => {
    expect(() =>
      assertValidStatusTransition(PATIENT_STATUS.FINALIZED, PATIENT_STATUS.IN_ATTENTION)
    ).toThrow(/ya fue finalizado/i);
  });

  it("lanza error genérico para otras transiciones inválidas", () => {
    expect(() =>
      assertValidStatusTransition(PATIENT_STATUS.IN_ATTENTION, PATIENT_STATUS.WAITING)
    ).toThrow(/no permitida/i);
  });
});

describe("isTerminalStatus", () => {
  it("Finalizado es terminal", () => {
    expect(isTerminalStatus(PATIENT_STATUS.FINALIZED)).toBe(true);
  });

  it("los demás no son terminales", () => {
    expect(isTerminalStatus(PATIENT_STATUS.WAITING)).toBe(false);
    expect(isTerminalStatus(PATIENT_STATUS.IN_ATTENTION)).toBe(false);
  });
});
