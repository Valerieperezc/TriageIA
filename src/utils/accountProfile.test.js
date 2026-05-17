import { describe, expect, it } from "vitest";
import {
  accountInitials,
  mergeProfileIntoUser,
  validateAccountProfileForm,
  validatePasswordChangeForm,
} from "./accountProfile";

describe("accountProfile", () => {
  it("accountInitials uses display name when set", () => {
    expect(accountInitials({ displayName: "Ana García", email: "a@b.com" })).toBe("AG");
  });

  it("mergeProfileIntoUser adds profile fields", () => {
    expect(
      mergeProfileIntoUser({ email: "a@b.com", role: "admin" }, { displayName: "Ana" })
    ).toMatchObject({
      email: "a@b.com",
      role: "admin",
      displayName: "Ana",
    });
  });

  it("validateAccountProfileForm rejects invalid phone", () => {
    const r = validateAccountProfileForm({ phone: "abc" });
    expect(r.valid).toBe(false);
    expect(r.errors.phone).toBeTruthy();
  });

  it("validatePasswordChangeForm requires matching passwords", () => {
    const r = validatePasswordChangeForm({
      currentPassword: "123456",
      newPassword: "654321",
      confirmPassword: "000000",
    });
    expect(r.valid).toBe(false);
    expect(r.errors.confirmPassword).toBeTruthy();
  });
});
