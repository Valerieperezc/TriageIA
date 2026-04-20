import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import {
  isPermissionDeniedError,
  permissionDeniedUserMessage,
} from "../utils/supabaseErrors";

const PATIENTS_KEY = "triageia:patients";
const EVENTS_KEY = "triageia:events";

function readLocal(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function throwIfPermissionDenied(error) {
  if (!error) return;
  if (isPermissionDeniedError(error)) {
    const next = new Error(permissionDeniedUserMessage());
    next.cause = error;
    throw next;
  }
  throw error;
}

function normalizeLocalPatient(p) {
  const createdAt = typeof p.createdAt === "number" ? p.createdAt : Date.now();
  const arrivedAt =
    typeof p.arrivedAt === "number" ? p.arrivedAt : createdAt;
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    symptom: p.symptom,
    temp: p.temp,
    fc: p.fc,
    triage: p.triage,
    status: p.status,
    createdAt,
    arrivedAt,
    firstAttentionAt:
      typeof p.firstAttentionAt === "number" ? p.firstAttentionAt : null,
    documentId: p.documentId ?? null,
    sex: p.sex ?? null,
    phone: p.phone ?? null,
    companion: p.companion ?? null,
    allergies: p.allergies ?? null,
    spo2: p.spo2 ?? null,
    pain: p.pain ?? null,
    alteredConsciousness: Boolean(p.alteredConsciousness),
    respiratoryDistress: Boolean(p.respiratoryDistress),
    fastTrack: Boolean(p.fastTrack),
  };
}

function mapDbPatient(patient) {
  const createdAt = new Date(patient.created_at).getTime();
  const arrivedRaw = patient.arrived_at;
  const arrivedAt = arrivedRaw
    ? new Date(arrivedRaw).getTime()
    : createdAt;
  return {
    id: patient.id,
    name: patient.name,
    age: patient.age,
    symptom: patient.symptom,
    temp: Number(patient.temp),
    fc: patient.fc,
    triage: patient.triage,
    status: patient.status,
    createdAt,
    arrivedAt,
    firstAttentionAt: patient.first_attention_at
      ? new Date(patient.first_attention_at).getTime()
      : null,
    documentId: patient.document_id ?? null,
    sex: patient.sex ?? null,
    phone: patient.phone ?? null,
    companion: patient.companion ?? null,
    allergies: patient.allergies ?? null,
    spo2: patient.spo2 ?? null,
    pain: patient.pain ?? null,
    alteredConsciousness: Boolean(patient.altered_consciousness),
    respiratoryDistress: Boolean(patient.respiratory_distress),
    fastTrack: Boolean(patient.fast_track),
  };
}

/** Fila SQL para insert (camelCase → snake_case). */
function toSupabaseInsertRow(payload) {
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
    respiratory_distress: Boolean(payload.respiratoryDistress),
    fast_track: Boolean(payload.fastTrack),
  };
}

export async function fetchPatients() {
  if (!isSupabaseConfigured) {
    return readLocal(PATIENTS_KEY).map(normalizeLocalPatient);
  }
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throwIfPermissionDenied(error);

  return data.map(mapDbPatient);
}

export async function createPatient(payload) {
  if (!isSupabaseConfigured) {
    const list = readLocal(PATIENTS_KEY);
    if (payload?.id) {
      const existing = list.find((item) => item.id === payload.id);
      if (existing) {
        return normalizeLocalPatient(existing);
      }
    }

    const now = Date.now();
    const arrivedAt =
      payload.arrivedAt != null ? payload.arrivedAt : now;
    const patient = normalizeLocalPatient({
      id: payload?.id ?? crypto.randomUUID(),
      ...payload,
      createdAt: now,
      arrivedAt,
      firstAttentionAt: null,
    });
    writeLocal(PATIENTS_KEY, [patient, ...list]);
    return patient;
  }
  const supabase = await getSupabaseClient();
  const row = toSupabaseInsertRow(payload);

  const { data, error } = await supabase
    .from("patients")
    .insert(row)
    .select()
    .single();

  if (error) {
    const duplicateById =
      payload?.id &&
      (error.code === "23505" ||
        String(error.message ?? "").toLowerCase().includes("duplicate key"));
    if (duplicateById) {
      const { data: existing, error: existingError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", payload.id)
        .single();
      if (!existingError && existing) {
        return mapDbPatient(existing);
      }
    }
    throwIfPermissionDenied(error);
  }

  return mapDbPatient(data);
}

export async function updatePatientStatus(id, status) {
  if (!isSupabaseConfigured) {
    const list = readLocal(PATIENTS_KEY);
    const updated = list.map((item) => {
      if (item.id !== id) return item;
      const base = normalizeLocalPatient(item);
      const next = { ...base, status };
      if (status === "En atención" && base.firstAttentionAt == null) {
        next.firstAttentionAt = Date.now();
      }
      return next;
    });
    writeLocal(PATIENTS_KEY, updated);
    return;
  }
  const supabase = await getSupabaseClient();

  const { data: current, error: readError } = await supabase
    .from("patients")
    .select("first_attention_at")
    .eq("id", id)
    .maybeSingle();

  if (readError) throwIfPermissionDenied(readError);

  const patch = { status };
  if (status === "En atención" && !current?.first_attention_at) {
    patch.first_attention_at = new Date().toISOString();
  }

  const { error } = await supabase.from("patients").update(patch).eq("id", id);

  if (error) throwIfPermissionDenied(error);
}

const DEMO_PATCH_KEYS = new Set([
  "name",
  "age",
  "documentId",
  "sex",
  "phone",
  "companion",
  "allergies",
]);

function toSupabaseDemographicsPatch(patch) {
  const out = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.age !== undefined) out.age = patch.age;
  if (patch.documentId !== undefined) out.document_id = patch.documentId;
  if (patch.sex !== undefined) out.sex = patch.sex;
  if (patch.phone !== undefined) out.phone = patch.phone;
  if (patch.companion !== undefined) out.companion = patch.companion;
  if (patch.allergies !== undefined) out.allergies = patch.allergies;
  return out;
}

/**
 * Actualiza datos identificación / contacto (completar tras ingreso mínimo).
 * @param {string} id
 * @param {object} patch
 */
export async function updatePatientDemographics(id, patch) {
  const safe = {};
  for (const k of Object.keys(patch)) {
    if (DEMO_PATCH_KEYS.has(k)) safe[k] = patch[k];
  }
  if (Object.keys(safe).length === 0) return;

  if (!isSupabaseConfigured) {
    const list = readLocal(PATIENTS_KEY);
    const updated = list.map((item) => {
      if (item.id !== id) return item;
      const base = normalizeLocalPatient(item);
      return normalizeLocalPatient({ ...base, ...safe });
    });
    writeLocal(PATIENTS_KEY, updated);
    return;
  }

  const supabase = await getSupabaseClient();
  const row = toSupabaseDemographicsPatch(safe);
  if (Object.keys(row).length === 0) return;

  const { error } = await supabase.from("patients").update(row).eq("id", id);
  if (error) throwIfPermissionDenied(error);
}

export async function fetchAuditEvents() {
  if (!isSupabaseConfigured) {
    return readLocal(EVENTS_KEY)
      .map((event) => {
        const createdAt =
          typeof event.createdAt === "number"
            ? event.createdAt
            : Date.parse(event.date ?? "") || 0;
        return {
          name: event.name ?? "",
          action: event.action ?? "",
          triage: event.triage ?? null,
          actor: event.actor ?? null,
          createdAt,
          date: event.date ?? (createdAt ? new Date(createdAt).toLocaleString() : ""),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((event) => ({
        name: event.name,
        action: event.action,
        triage: event.triage,
        actor: event.actor,
        date: event.date,
      }));
  }
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("patient_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throwIfPermissionDenied(error);

  return data.map((event) => ({
    name: event.patient_name,
    action: event.action,
    triage: event.triage,
    actor: event.actor_email ?? null,
    date: new Date(event.created_at).toLocaleString(),
  }));
}

export async function createAuditEvent(event) {
  if (!isSupabaseConfigured) {
    const events = readLocal(EVENTS_KEY);
    if (event.request_id) {
      const alreadyExists = events.some((item) => item.requestId === event.request_id);
      if (alreadyExists) {
        return;
      }
    }
    const normalized = {
      name: event.patient_name,
      action: event.action,
      triage: event.triage ?? null,
      actor: event.actor_email ?? null,
      requestId: event.request_id ?? null,
      createdAt: Date.now(),
      date: new Date().toLocaleString(),
    };
    writeLocal(EVENTS_KEY, [normalized, ...events]);
    return;
  }
  const supabase = await getSupabaseClient();

  const row = {
    patient_id: event.patient_id,
    patient_name: event.patient_name,
    action: event.action,
    triage: event.triage ?? null,
  };
  if (event.actor_email) {
    row.actor_email = event.actor_email;
  }
  if (event.request_id) {
    row.request_id = event.request_id;
  }

  const q = event.request_id
    ? supabase
        .from("patient_events")
        .upsert(row, { onConflict: "request_id", ignoreDuplicates: true })
    : supabase.from("patient_events").insert(row);

  let { error } = await q;
  if (
    error &&
    event.request_id &&
    String(error.message ?? "").toLowerCase().includes("request_id")
  ) {
    const fallbackRow = { ...row };
    delete fallbackRow.request_id;
    ({ error } = await supabase.from("patient_events").insert(fallbackRow));
  }
  if (error) throwIfPermissionDenied(error);
}
