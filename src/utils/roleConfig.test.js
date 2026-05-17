import { describe, expect, it } from "vitest";
import {
  getHomePathForRole,
  getRoleCapabilities,
  getSidebarNavOrder,
} from "./roleConfig";

describe("roleConfig", () => {
  it("assigns distinct home paths per role", () => {
    expect(getHomePathForRole("admin")).toBe("/");
    expect(getHomePathForRole("medico")).toBe("/patients");
    expect(getHomePathForRole("recepcion")).toBe("/triage");
    expect(getHomePathForRole("enfermeria")).toBe("/");
  });

  it("reflects permission matrix", () => {
    expect(getRoleCapabilities("recepcion")).toEqual({
      canRegister: true,
      canAttend: false,
      canFinalize: false,
      canEditDemographics: false,
      canAudit: false,
    });
    expect(getRoleCapabilities("medico")).toMatchObject({
      canRegister: false,
      canFinalize: true,
      canAttend: true,
    });
    expect(getRoleCapabilities("admin").canAudit).toBe(true);
  });

  it("orders sidebar for medico without triage", () => {
    expect(getSidebarNavOrder("medico")).toEqual([
      "patients",
      "dashboard",
      "settings",
    ]);
  });
});
