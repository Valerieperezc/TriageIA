#!/usr/bin/env node
/**
 * Genera un CSV sintético de pacientes con vitales clínicamente plausibles
 * para alimentar TriageIA en pruebas, demos y carga inicial de la BD.
 *
 * El esquema replica el dataset "simulado" tipo Kaggle (2000 pacientes con
 * Age, Gender, 3 síntomas, Body Temperature (°C), Heart Rate (bpm),
 * Oxygen Saturation (%), Diagnosis, Severity, Treatment Plan), de forma que
 * `scripts/seedDataset.mjs` pueda consumirlo con el mapping ya provisto.
 *
 * Características:
 *  - Mezcla controlada de severidades (mild / moderate / severe / critical),
 *    para cubrir todos los niveles CTAS (I a V) sin saturar urgencias.
 *  - Vitales generados con rangos realistas por severidad.
 *  - Síntomas seleccionados de un vocabulario corto y compatible con la UI.
 *  - Determinista cuando `--seed <n>` se proporciona (útil para tests).
 *
 * Uso:
 *   node scripts/generateSyntheticDataset.mjs --out data/synthetic_patients.csv
 *   node scripts/generateSyntheticDataset.mjs --out data/synthetic_patients.csv --rows 500 --seed 42
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

function argValue(argv, name) {
  const i = argv.indexOf(name);
  if (i === -1 || i + 1 >= argv.length) return null;
  return argv[i + 1];
}

/** PRNG mulberry32 para reproducibilidad cuando se pasa `--seed`. */
function createRng(seed) {
  let s = (seed >>> 0) || 0xdeadbeef;
  return function next() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(rng, min, max, decimals = 1) {
  const v = rng() * (max - min) + min;
  const m = Math.pow(10, decimals);
  return Math.round(v * m) / m;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

const SYMPTOMS = [
  "Cough",
  "Fever",
  "Headache",
  "Sore throat",
  "Fatigue",
  "Shortness of breath",
  "Chest pain",
  "Nausea",
  "Vomiting",
  "Diarrhea",
  "Abdominal pain",
  "Dizziness",
  "Body ache",
  "Loss of appetite",
  "Runny nose",
  "Back pain",
];

const DIAGNOSIS_BY_SEVERITY = {
  mild: ["Cold", "Healthy", "Allergy"],
  moderate: ["Flu", "Bronchitis", "Gastroenteritis"],
  severe: ["Pneumonia", "Severe asthma exacerbation"],
  critical: ["Septic shock", "Acute respiratory failure"],
};

const TREATMENT_BY_SEVERITY = {
  mild: "Rest and hydration",
  moderate: "Outpatient medication",
  severe: "Hospital admission",
  critical: "ICU admission",
};

/** Selecciona N síntomas distintos. */
function pickSymptoms(rng, n) {
  const pool = [...SYMPTOMS];
  const out = [];
  for (let i = 0; i < n && pool.length > 0; i += 1) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

/** Vitales por severidad (cubren todos los niveles CTAS). */
function vitalsFor(rng, severity) {
  switch (severity) {
    case "critical":
      return {
        temp: randFloat(rng, 39.6, 41.5),
        fc: randInt(rng, 130, 170),
        spo2: randInt(rng, 78, 89),
      };
    case "severe":
      return {
        temp: randFloat(rng, 38.8, 40.2),
        fc: randInt(rng, 115, 145),
        spo2: randInt(rng, 88, 93),
      };
    case "moderate":
      return {
        temp: randFloat(rng, 37.8, 39.2),
        fc: randInt(rng, 95, 120),
        spo2: randInt(rng, 93, 96),
      };
    case "mild":
    default:
      return {
        temp: randFloat(rng, 36.2, 37.6),
        fc: randInt(rng, 60, 95),
        spo2: randInt(rng, 96, 100),
      };
  }
}

function ageDistribution(rng) {
  const r = rng();
  if (r < 0.1) return randInt(rng, 0, 12);
  if (r < 0.2) return randInt(rng, 13, 25);
  if (r < 0.55) return randInt(rng, 26, 55);
  if (r < 0.85) return randInt(rng, 56, 75);
  return randInt(rng, 76, 95);
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function generateRow(rng, severity) {
  const age = ageDistribution(rng);
  const gender = rng() < 0.5 ? "Male" : "Female";
  const [s1, s2, s3] = pickSymptoms(rng, 3);
  const v = vitalsFor(rng, severity);
  const diagnosis = pick(rng, DIAGNOSIS_BY_SEVERITY[severity]);
  const treatment = TREATMENT_BY_SEVERITY[severity];

  let pain;
  if (severity === "critical") pain = randInt(rng, 8, 10);
  else if (severity === "severe") pain = randInt(rng, 6, 9);
  else if (severity === "moderate") pain = randInt(rng, 3, 7);
  else pain = randInt(rng, 0, 4);

  return {
    Age: age,
    Gender: gender,
    "Symptom 1": s1,
    "Symptom 2": s2,
    "Symptom 3": s3,
    "Body Temperature (Celsius)": v.temp,
    "Heart Rate (bpm)": v.fc,
    "Oxygen Saturation (%)": clamp(v.spo2, 50, 100),
    "Pain (0-10)": pain,
    Diagnosis: diagnosis,
    Severity:
      severity === "critical"
        ? "Severe"
        : severity.charAt(0).toUpperCase() + severity.slice(1),
    "Treatment Plan": treatment,
  };
}

function pickSeverity(rng) {
  const r = rng();
  if (r < 0.05) return "critical";
  if (r < 0.2) return "severe";
  if (r < 0.55) return "moderate";
  return "mild";
}

function main() {
  const argv = process.argv.slice(2);
  const out = argValue(argv, "--out") ?? "data/synthetic_patients.csv";
  const rows = Number(argValue(argv, "--rows") ?? "2000") || 2000;
  const seedRaw = argValue(argv, "--seed");
  const seed = seedRaw != null ? Number(seedRaw) : Date.now() & 0xffffffff;
  const rng = createRng(seed);

  const headers = [
    "Age",
    "Gender",
    "Symptom 1",
    "Symptom 2",
    "Symptom 3",
    "Body Temperature (Celsius)",
    "Heart Rate (bpm)",
    "Oxygen Saturation (%)",
    "Pain (0-10)",
    "Diagnosis",
    "Severity",
    "Treatment Plan",
  ];

  const lines = [headers.join(",")];

  const counts = { mild: 0, moderate: 0, severe: 0, critical: 0 };

  for (let i = 0; i < rows; i += 1) {
    const severity = pickSeverity(rng);
    counts[severity] += 1;
    const row = generateRow(rng, severity);
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }

  const target = resolve(out);
  writeFileSync(target, lines.join("\n") + "\n", "utf8");

  console.error(
    JSON.stringify(
      {
        out: target,
        rows,
        seed,
        severityCounts: counts,
      },
      null,
      2
    )
  );
}

main();
