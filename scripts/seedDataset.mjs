#!/usr/bin/env node
/**
 * Importa un CSV de dataset a filas compatibles con `patients` (validación + triage CTAS).
 *
 * Uso (desde la raíz del repo):
 *   node scripts/seedDataset.mjs --csv data/mi_dataset.csv --mapping data/mi_dataset.mapping.json
 *   node scripts/seedDataset.mjs --csv data/x.csv --mapping data/x.mapping.json --dry-run --limit 20
 *   node scripts/seedDataset.mjs --csv data/x.csv --mapping data/x.mapping.json --out data/seed.sql
 *
 * Inserción directa (requiere SUPABASE_SERVICE_ROLE_KEY en .env; no uses esta clave en el front):
 *   node scripts/seedDataset.mjs --csv data/x.csv --mapping data/x.mapping.json --insert-supabase --limit 500
 *
 * Ajusta el JSON de mapeo para que los valores coincidan exactamente con la primera fila del CSV (cabeceras).
 */

import { randomUUID } from "node:crypto";
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse";
import { createClient } from "@supabase/supabase-js";

import { loadEnvFromDotenv } from "./loadEnv.mjs";
import { calculateTriage } from "../src/utils/triage.js";
import { validateTriagePayload } from "../src/utils/triageFormValidation.js";

function usage() {
  console.error(`
Opciones:
  --csv <ruta>              Archivo CSV (obligatorio)
  --mapping <ruta>          JSON de mapeo de columnas (obligatorio)
  --out <ruta>              Escribir salida (si no, stdout)
  --format sql|json         Salida: SQL multi-row o JSON (default: sql)
  --dry-run                 No escribe archivo ni inserta; solo resumen
  --limit <n>               Máximo de filas válidas a procesar (después de cabecera)
  --insert-supabase         Insertar con SUPABASE_SERVICE_ROLE_KEY (ver .env)
  --batch <n>               Tamaño de lote para Supabase (default: 80)
`);
}

function argValue(argv, name) {
  const i = argv.indexOf(name);
  if (i === -1 || i + 1 >= argv.length) return null;
  return argv[i + 1];
}

function hasFlag(argv, name) {
  return argv.includes(name);
}

function getCell(row, columnName) {
  if (columnName == null || columnName === "") return null;
  const v = row[columnName];
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function buildSymptom(row, mapping) {
  const cols = mapping.symptomColumns;
  if (!Array.isArray(cols) || cols.length === 0) {
    throw new Error('El mapeo debe incluir "symptomColumns": ["Columna1", ...]');
  }
  const sep = mapping.symptomSeparator ?? " / ";
  const parts = [];
  for (const c of cols) {
    const t = getCell(row, c);
    if (t) parts.push(t);
  }
  return parts.join(sep);
}

function buildName(row, mapping, rowIndex) {
  const fromCol = mapping.nameFromColumn;
  if (fromCol) {
    const v = getCell(row, fromCol);
    if (v) return v;
  }
  const prefix = mapping.namePrefix ?? "Paciente ";
  const suffixCol = mapping.nameSuffixFromColumn;
  if (suffixCol) {
    const s = getCell(row, suffixCol);
    if (s) return `${prefix}${s}`.trim();
  }
  return `${prefix}${rowIndex}`.trim();
}

function rowToRawPatient(row, mapping, rowIndex) {
  const name = buildName(row, mapping, rowIndex);
  const ageStr = getCell(row, mapping.age);
  const symptom = buildSymptom(row, mapping);
  const tempStr = getCell(row, mapping.temp);
  const fcStr = getCell(row, mapping.fc);
  const sexStr = mapping.sex ? getCell(row, mapping.sex) : null;

  const raw = {
    name,
    age: ageStr ?? "",
    symptom,
    temp: tempStr ?? "",
    fc: fcStr ?? "",
    respiratoryRate:
      (mapping.respiratoryRate && getCell(row, mapping.respiratoryRate)) ??
      (mapping.fr && getCell(row, mapping.fr)) ??
      "16",
    bpSystolic:
      (mapping.bpSystolic && getCell(row, mapping.bpSystolic)) ??
      (mapping.taSistolica && getCell(row, mapping.taSistolica)) ??
      "120",
    bpDiastolic:
      (mapping.bpDiastolic && getCell(row, mapping.bpDiastolic)) ??
      (mapping.taDiastolica && getCell(row, mapping.taDiastolica)) ??
      "80",
    sex: sexStr ?? "",
    alteredConsciousness: false,
    fastTrack: false,
  };

  if (mapping.spo2) {
    const s = getCell(row, mapping.spo2);
    raw.spo2 = s != null ? s : "";
  }
  if (mapping.pain) {
    const p = getCell(row, mapping.pain);
    raw.pain = p != null ? p : "";
  }

  return raw;
}

function toDbInsertRow(payload) {
  return {
    id: payload.id,
    name: payload.name,
    age: payload.age,
    symptom: payload.symptom,
    temp: payload.temp,
    fc: payload.fc,
    triage: payload.triage,
    status: payload.status ?? "En espera",
    arrived_at: new Date(
      payload.arrivedAt != null ? payload.arrivedAt : Date.now()
    ).toISOString(),
    first_attention_at: null,
    document_id: payload.documentId ?? null,
    sex: payload.sex ?? null,
    phone: payload.phone ?? null,
    companion: payload.companion ?? null,
    allergies: payload.allergies ?? null,
    spo2: payload.spo2 ?? null,
    pain: payload.pain ?? null,
    altered_consciousness: Boolean(payload.alteredConsciousness),
    respiratory_distress: false,
    respiratory_rate: payload.respiratoryRate ?? null,
    bp_systolic: payload.bpSystolic ?? null,
    bp_diastolic: payload.bpDiastolic ?? null,
    religion: payload.religion ?? null,
    blood_type: payload.bloodType ?? null,
    fast_track: Boolean(payload.fastTrack),
  };
}

function sqlEscapeString(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function sqlValue(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "NULL";
    return String(v);
  }
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return `${sqlEscapeString(v)}::timestamptz`;
  }
  return sqlEscapeString(v);
}

function rowsToSqlInsert(rows) {
  const cols = [
    "id",
    "name",
    "age",
    "symptom",
    "temp",
    "fc",
    "triage",
    "status",
    "arrived_at",
    "first_attention_at",
    "document_id",
    "sex",
    "phone",
    "companion",
    "allergies",
    "spo2",
    "pain",
    "altered_consciousness",
    "respiratory_distress",
    "respiratory_rate",
    "bp_systolic",
    "bp_diastolic",
    "religion",
    "blood_type",
    "fast_track",
  ];
  const header = `INSERT INTO public.patients (${cols.join(", ")}) VALUES\n`;
  const valueLines = rows.map((r) => {
    const tuple = cols.map((c) => sqlValue(r[c])).join(", ");
    return `  (${tuple})`;
  });
  return `${header}${valueLines.join(",\n")};\n`;
}

async function readCsvRecords(csvPath) {
  const abs = resolve(csvPath);
  const input = createReadStream(abs, { encoding: "utf8" });
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });
  const records = [];
  for await (const row of input.pipe(parser)) {
    records.push(row);
  }
  return records;
}

async function main() {
  loadEnvFromDotenv(process.cwd());
  const argv = process.argv.slice(2);
  const csvPath = argValue(argv, "--csv");
  const mappingPath = argValue(argv, "--mapping");
  const outPath = argValue(argv, "--out");
  const format = (argValue(argv, "--format") ?? "sql").toLowerCase();
  const dryRun = hasFlag(argv, "--dry-run");
  const insertSupabase = hasFlag(argv, "--insert-supabase");
  const limitRaw = argValue(argv, "--limit");
  const limit = limitRaw != null ? Number(limitRaw) : Infinity;
  const batchSize = Math.max(
    1,
    Number(argValue(argv, "--batch") ?? "80") || 80
  );

  if (!csvPath || !mappingPath) {
    usage();
    process.exit(1);
  }

  const mapping = JSON.parse(readFileSync(resolve(mappingPath), "utf8"));
  const records = await readCsvRecords(csvPath);

  let validCount = 0;
  let skipped = 0;
  const errorsSample = [];
  const dbRows = [];

  let rowIndex = 0;
  for (const row of records) {
    rowIndex += 1;
    const raw = rowToRawPatient(row, mapping, rowIndex);
    const vr = validateTriagePayload({
      name: raw.name,
      age: raw.age === "" || raw.age == null ? "" : raw.age,
      symptom: raw.symptom,
      temp: raw.temp === "" || raw.temp == null ? "" : raw.temp,
      fc: raw.fc === "" || raw.fc == null ? "" : raw.fc,
      spo2:
        raw.spo2 === undefined
          ? ""
          : raw.spo2 === ""
            ? ""
            : String(raw.spo2),
      pain:
        raw.pain === undefined
          ? ""
          : raw.pain === ""
            ? ""
            : String(raw.pain),
      alteredConsciousness: false,
      respiratoryRate:
        raw.respiratoryRate === undefined || raw.respiratoryRate === null
          ? ""
          : String(raw.respiratoryRate),
      bpSystolic:
        raw.bpSystolic === undefined || raw.bpSystolic === null
          ? ""
          : String(raw.bpSystolic),
      bpDiastolic:
        raw.bpDiastolic === undefined || raw.bpDiastolic === null
          ? ""
          : String(raw.bpDiastolic),
      documentId: "",
      sex: raw.sex ?? "",
      phone: "",
      companion: "",
      allergies: "",
      religion: "",
      bloodType: "",
      fastTrack: false,
    });

    if (!vr.valid) {
      skipped += 1;
      if (errorsSample.length < 8) {
        const firstKey = Object.keys(vr.errors)[0];
        errorsSample.push({
          row: rowIndex,
          error: vr.errors[firstKey] ?? "inválido",
        });
      }
      continue;
    }

    const values = vr.values;
    const triage = calculateTriage(values.temp, values.fc, {
      spo2: values.spo2,
      pain: values.pain,
      alteredConsciousness: values.alteredConsciousness,
      respiratoryRate: values.respiratoryRate,
      bpSystolic: values.bpSystolic,
      bpDiastolic: values.bpDiastolic,
    });

    const payload = {
      id: randomUUID(),
      ...values,
      triage,
      status: "En espera",
    };

    dbRows.push(toDbInsertRow(payload));
    validCount += 1;
    if (validCount >= limit) break;
  }

  const summary = {
    totalCsvRows: records.length,
    validInserted: dbRows.length,
    skippedInvalid: skipped,
    sampleErrors: errorsSample,
  };

  console.error(JSON.stringify(summary, null, 2));

  if (dryRun) {
    process.exit(0);
  }

  if (insertSupabase) {
    const url = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error(
        "Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno (.env)."
      );
      process.exit(1);
    }
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    for (let i = 0; i < dbRows.length; i += batchSize) {
      const chunk = dbRows.slice(i, i + batchSize);
      const { error } = await supabase.from("patients").insert(chunk);
      if (error) {
        console.error("Error Supabase:", error.message);
        process.exit(1);
      }
    }
    console.error(`Insertadas ${dbRows.length} filas en public.patients.`);
    process.exit(0);
  }

  let body;
  if (format === "json") {
    body = JSON.stringify(dbRows, null, 2);
  } else if (format === "sql") {
    if (dbRows.length === 0) {
      body = "-- Sin filas válidas.\n";
    } else {
      const chunks = [];
      const chunkSize = 40;
      for (let i = 0; i < dbRows.length; i += chunkSize) {
        chunks.push(rowsToSqlInsert(dbRows.slice(i, i + chunkSize)));
      }
      body = chunks.join("\n");
    }
  } else {
    console.error('Formato desconocido: use "sql" o "json".');
    process.exit(1);
  }

  if (outPath) {
    writeFileSync(resolve(outPath), body, "utf8");
    console.error(`Escrito: ${resolve(outPath)}`);
  } else {
    process.stdout.write(body);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
