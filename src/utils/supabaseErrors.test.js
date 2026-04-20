import { describe, expect, it } from "vitest";
import {
  isPermissionDeniedError,
  permissionDeniedUserMessage,
} from "./supabaseErrors";

describe("supabaseErrors", () => {
  it("detects Postgres insufficient_privilege", () => {
    expect(isPermissionDeniedError({ code: "42501", message: "x" })).toBe(true);
  });

  it("detects PostgREST-style denial", () => {
    expect(isPermissionDeniedError({ code: "PGRST301" })).toBe(true);
  });

  it("detects RLS from message", () => {
    expect(
      isPermissionDeniedError({
        message: "new row violates row-level security policy for table patient_events",
      })
    ).toBe(true);
  });

  it("returns stable user-facing copy", () => {
    expect(permissionDeniedUserMessage()).toMatch(/permiso/i);
  });
});
