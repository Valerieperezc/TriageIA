import { describe, expect, it } from "vitest";
import {
  isProfileApproved,
  normalizeProfileStatus,
  validateRegistrationInput,
} from "./userAccounts";

describe("userAccounts", () => {
  it("normalizes unknown status to pending (or approved if legacy)", () => {
    expect(normalizeProfileStatus(null)).toBe("pending");
    expect(normalizeProfileStatus("")).toBe("pending");
    expect(normalizeProfileStatus(null, { legacyWithoutColumn: true })).toBe("approved");
  });

  it("detects approved profiles", () => {
    expect(isProfileApproved("approved")).toBe(true);
    expect(isProfileApproved("pending")).toBe(false);
  });

  it("validates registration payload", () => {
    const result = validateRegistrationInput({
      email: "nuevo@triage.com",
      password: "123456",
      displayName: "Usuario Nuevo",
      role: "medico",
    });
    expect(result.valid).toBe(true);
    expect(result.values.role).toBe("medico");
  });

  it("rejects admin role on self-registration", () => {
    const result = validateRegistrationInput({
      email: "x@triage.com",
      password: "123456",
      displayName: "Test",
      role: "admin",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.role).toBeTruthy();
  });
});
