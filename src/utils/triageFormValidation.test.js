import { describe, expect, it } from "vitest";
import {
  assertValidTriagePayload,
  validateTriageForm,
  validateTriagePayload,
} from "./triageFormValidation";

const ok = {
  name: "Ana López",
  age: "45",
  symptom: "Dolor torácico",
  temp: "37.5",
  fc: "88",
};

describe("validateTriageForm", () => {
  it("acepta un formulario válido y devuelve valores normalizados", () => {
    const r = validateTriageForm(ok);
    expect(r.valid).toBe(true);
    expect(r.values).toMatchObject({
      name: "Ana López",
      age: 45,
      symptom: "Dolor torácico",
      temp: 37.5,
      fc: 88,
      spo2: null,
      pain: null,
      alteredConsciousness: false,
      respiratoryDistress: false,
      fastTrack: false,
    });
    expect(typeof r.values.arrivedAt).toBe("number");
  });

  it("acepta coma decimal en temperatura", () => {
    const r = validateTriageForm({ ...ok, temp: "38,2" });
    expect(r.valid).toBe(true);
    expect(r.values.temp).toBe(38.2);
  });

  it("rechaza campos de texto vacíos obligatorios", () => {
    const r = validateTriageForm({ ...ok, name: "   " });
    expect(r.valid).toBe(false);
    expect(r.errors.name).toBeDefined();
  });

  it("rechaza edad no entera o fuera de rango", () => {
    expect(validateTriageForm({ ...ok, age: "40.5" }).valid).toBe(false);
    expect(validateTriageForm({ ...ok, age: "200" }).valid).toBe(false);
  });

  it("rechaza temperatura o FC fuera de rango", () => {
    expect(validateTriageForm({ ...ok, temp: "20" }).valid).toBe(false);
    expect(validateTriageForm({ ...ok, fc: "10" }).valid).toBe(false);
  });
});

describe("validateTriagePayload / assertValidTriagePayload", () => {
  it("acepta números ya tipados", () => {
    const r = validateTriagePayload({
      name: "X",
      age: 40,
      symptom: "Y",
      temp: 37.2,
      fc: 80,
    });
    expect(r.valid).toBe(true);
    expect(r.values.age).toBe(40);
    expect(r.values.temp).toBe(37.2);
  });

  it("assertValidTriagePayload lanza si falla", () => {
    expect(() =>
      assertValidTriagePayload({ name: "", age: 1, symptom: "s", temp: 37, fc: 80 })
    ).toThrow();
  });
});
