import { describe, expect, it } from "vitest";
import {
  canCreatePatientByRole,
  canFinalizePatientByRole,
  canSetInAttentionByRole,
  canUpdatePatientDemographicsByRole,
  canViewAuditByRole,
  normalizeRole,
} from "./permissions";

describe("role permissions", () => {
  it("normalizeRole acepta variantes", () => {
    expect(normalizeRole(" Admin ")).toBe("admin");
    expect(normalizeRole("recepción")).toBe("recepcion");
  });

  it("allows create for recepcion", () => {
    expect(canCreatePatientByRole("recepcion")).toBe(true);
  });

  it("blocks create for medico", () => {
    expect(canCreatePatientByRole("medico")).toBe(false);
  });

  it("allows set in attention for enfermeria", () => {
    expect(canSetInAttentionByRole("enfermeria")).toBe(true);
  });

  it("blocks finalize for enfermeria", () => {
    expect(canFinalizePatientByRole("enfermeria")).toBe(false);
  });

  it("allows finalize for admin", () => {
    expect(canFinalizePatientByRole("admin")).toBe(true);
  });

  it("allows demographics update for enfermeria", () => {
    expect(canUpdatePatientDemographicsByRole("enfermeria")).toBe(true);
  });

  it("blocks demographics update for recepcion", () => {
    expect(canUpdatePatientDemographicsByRole("recepcion")).toBe(false);
  });

  it("allows audit only for admin", () => {
    expect(canViewAuditByRole("admin")).toBe(true);
    expect(canViewAuditByRole("medico")).toBe(false);
  });
});
