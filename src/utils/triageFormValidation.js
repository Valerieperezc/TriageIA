/** Rangos clínicos razonables para evitar errores de registro (no sustituyen criterio médico). */
export const TRIAGE_FORM_LIMITS = {
  ageMin: 0,
  ageMax: 130,
  tempMin: 30,
  tempMax: 45,
  fcMin: 25,
  fcMax: 250,
  spo2Min: 50,
  spo2Max: 100,
  painMin: 0,
  painMax: 10,
};

/** Parseo de temperatura (admite coma o punto). */
export function parseTempInput(raw) {
  if (raw === "" || raw == null) return NaN;
  return Number(String(raw).trim().replace(",", "."));
}

/** `datetime-local` (YYYY-MM-DDTHH:mm) → ms. Vacío → NaN. */
export function parseDateTimeLocalMs(raw) {
  if (raw === "" || raw == null) return NaN;
  const t = Date.parse(String(raw).trim());
  return Number.isFinite(t) ? t : NaN;
}

function trimOrEmpty(s) {
  return typeof s === "string" ? s.trim() : "";
}

/**
 * Valida el formulario de registro de triage antes de enviar a `addPatient`.
 * @param {object} raw
 * @param {{ fastTrack?: boolean }} [options]
 * @returns {{ valid: boolean, errors: Record<string, string>, values?: object }}
 */
export function validateTriageForm(raw, options = {}) {
  const fastTrack = Boolean(raw?.fastTrack ?? options.fastTrack);
  const errors = {};
  const {
    ageMin,
    ageMax,
    tempMin,
    tempMax,
    fcMin,
    fcMax,
    spo2Min,
    spo2Max,
    painMin,
    painMax,
  } = TRIAGE_FORM_LIMITS;

  const nameRaw = trimOrEmpty(raw?.name);
  const symptomRaw = trimOrEmpty(raw?.symptom);

  let name = nameRaw;
  let symptom = symptomRaw;

  if (fastTrack) {
    if (!name) name = "Paciente sin identificar";
    if (!symptom) symptom = "Crítico / datos incompletos";
  } else {
    if (!name) errors.name = "El nombre es obligatorio.";
    if (!symptom) errors.symptom = "El síntoma principal es obligatorio.";
  }

  const ageStr =
    raw?.age === "" || raw?.age == null ? "" : String(raw.age).trim();
  let ageNum;
  if (fastTrack && ageStr === "") {
    ageNum = 0;
  } else if (ageStr === "") {
    errors.age = "La edad es obligatoria.";
  } else {
    ageNum = Number(ageStr);
    if (!Number.isFinite(ageNum) || !Number.isInteger(ageNum)) {
      errors.age = "Indica la edad en años (número entero).";
    } else if (ageNum < ageMin || ageNum > ageMax) {
      errors.age = `La edad debe estar entre ${ageMin} y ${ageMax}.`;
    }
  }

  const tempStr =
    raw?.temp === "" || raw?.temp == null ? "" : String(raw.temp).trim();
  let tempNum;
  if (tempStr === "") {
    errors.temp = "La temperatura es obligatoria.";
  } else {
    tempNum = parseTempInput(tempStr);
    if (!Number.isFinite(tempNum)) {
      errors.temp = "Indica un valor numérico válido (°C).";
    } else if (tempNum < tempMin || tempNum > tempMax) {
      errors.temp = `Temperatura fuera de rango (${tempMin}–${tempMax} °C).`;
    }
  }

  const fcStr = raw?.fc === "" || raw?.fc == null ? "" : String(raw.fc).trim();
  let fcNum;
  if (fcStr === "") {
    errors.fc = "La frecuencia cardíaca es obligatoria.";
  } else {
    fcNum = Number(fcStr.trim().replace(",", "."));
    if (!Number.isFinite(fcNum) || !Number.isInteger(fcNum)) {
      errors.fc = "Indica la FC en lpm (número entero).";
    } else if (fcNum < fcMin || fcNum > fcMax) {
      errors.fc = `FC fuera de rango (${fcMin}–${fcMax} lpm).`;
    }
  }

  const spo2Str =
    raw?.spo2 === "" || raw?.spo2 == null ? "" : String(raw.spo2).trim();
  let spo2Num = null;
  if (spo2Str !== "") {
    spo2Num = Number(spo2Str.replace(",", "."));
    if (!Number.isFinite(spo2Num) || !Number.isInteger(spo2Num)) {
      errors.spo2 = "SpO₂ debe ser un entero (%).";
    } else if (spo2Num < spo2Min || spo2Num > spo2Max) {
      errors.spo2 = `SpO₂ fuera de rango (${spo2Min}–${spo2Max}).`;
    }
  }

  const painStr =
    raw?.pain === "" || raw?.pain == null ? "" : String(raw.pain).trim();
  let painNum = null;
  if (painStr !== "") {
    painNum = Number(painStr.replace(",", "."));
    if (!Number.isFinite(painNum) || !Number.isInteger(painNum)) {
      errors.pain = "EVA debe ser un entero entre 0 y 10.";
    } else if (painNum < painMin || painNum > painMax) {
      errors.pain = `EVA entre ${painMin} y ${painMax}.`;
    }
  }

  const alteredConsciousness = Boolean(raw?.alteredConsciousness);
  const respiratoryDistress = Boolean(raw?.respiratoryDistress);

  const documentId = trimOrEmpty(raw?.documentId);
  const sex = trimOrEmpty(raw?.sex);
  const phone = trimOrEmpty(raw?.phone);
  const companion = trimOrEmpty(raw?.companion);
  const allergies = trimOrEmpty(raw?.allergies);

  const arrivedRaw = raw?.arrivedAt;
  let arrivedAtMs;
  if (typeof arrivedRaw === "number" && Number.isFinite(arrivedRaw)) {
    arrivedAtMs = arrivedRaw;
  } else if (arrivedRaw === "" || arrivedRaw == null) {
    arrivedAtMs = Date.now();
  } else {
    const parsed = parseDateTimeLocalMs(arrivedRaw);
    arrivedAtMs = Number.isFinite(parsed) ? parsed : Date.now();
  }

  const valid = Object.keys(errors).length === 0;
  if (!valid) {
    return { valid, errors };
  }

  const tempRounded = Math.round(tempNum * 10) / 10;

  return {
    valid: true,
    errors: {},
    values: {
      name,
      age: ageNum,
      symptom,
      temp: tempRounded,
      fc: fcNum,
      spo2: spo2Num,
      pain: painNum,
      alteredConsciousness,
      respiratoryDistress,
      documentId: documentId || null,
      sex: sex || null,
      phone: phone || null,
      companion: companion || null,
      allergies: allergies || null,
      arrivedAt: arrivedAtMs,
      fastTrack,
    },
  };
}

/**
 * Misma reglas que `validateTriageForm`, pero acepta valores ya tipados (p. ej. desde API o tests).
 */
export function validateTriagePayload(input) {
  return validateTriageForm({
    name: input?.name ?? "",
    age:
      input?.age === undefined || input?.age === null
        ? ""
        : String(input.age),
    symptom: input?.symptom ?? "",
    temp:
      input?.temp === undefined || input?.temp === null
        ? ""
        : String(input.temp),
    fc: input?.fc === undefined || input?.fc === null ? "" : String(input.fc),
    spo2:
      input?.spo2 === undefined || input?.spo2 === null
        ? ""
        : String(input.spo2),
    pain:
      input?.pain === undefined || input?.pain === null
        ? ""
        : String(input.pain),
    alteredConsciousness: input?.alteredConsciousness,
    respiratoryDistress: input?.respiratoryDistress,
    documentId: input?.documentId ?? "",
    sex: input?.sex ?? "",
    phone: input?.phone ?? "",
    companion: input?.companion ?? "",
    allergies: input?.allergies ?? "",
    arrivedAt: input?.arrivedAt,
    fastTrack: input?.fastTrack,
  });
}

/**
 * Validación defensiva en `addPatient`: rechaza datos inválidos aunque no vengan del formulario.
 * @throws {Error} primer mensaje de error de validación
 */
export function assertValidTriagePayload(input) {
  const r = validateTriagePayload(input);
  if (!r.valid) {
    const msg =
      Object.values(r.errors)[0] ?? "Datos del paciente no válidos.";
    throw new Error(msg);
  }
  return r.values;
}
