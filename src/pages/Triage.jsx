import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import toast from "react-hot-toast";
import {
  CTAS_CHIEF_COMPLAINTS,
  CTAS_RED_FLAGS,
} from "../constants/ctasProtocol";
import { TriageCtasAssignment } from "../components/TriageCtasAssignment";
import { suggestCtasLevel, validateTriageAssignment } from "../utils/ctasTriage";
import { parseTempInput, validateTriageForm } from "../utils/triageFormValidation";
import { DataState } from "../components/DataState";
import { AlertTriangle, ArrowLeft, Stethoscope } from "lucide-react";

const BLOOD_TYPE_OPTIONS = [
  { value: "", label: "No indicado" },
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
  { value: "desconocido", label: "Desconocido" },
];

function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <label className="form-label">{label}</label>
      {children}
      {error ? (
        <p
          className="text-xs font-medium text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
        {title}
      </h2>
      {description ? (
        <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function toDateTimeLocalValue(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseIntOrNaN(raw) {
  const s = raw === "" || raw == null ? "" : String(raw).trim();
  if (s === "") return NaN;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && Number.isInteger(n) ? n : NaN;
}

export default function Triage() {
  const navigate = useNavigate();
  const { addPatient, canCreatePatient, loading, error, reload } = usePatients();

  const [triageAssigned, setTriageAssigned] = useState("");
  const [overrideReasonCode, setOverrideReasonCode] = useState("");
  const [overrideNote, setOverrideNote] = useState("");
  const [assignmentError, setAssignmentError] = useState("");

  const [form, setForm] = useState(() => ({
    fastTrack: false,
    chiefComplaintCode: "",
    redFlags: [],
    name: "",
    age: "",
    symptom: "",
    temp: "",
    fc: "",
    respiratoryRate: "",
    bpSystolic: "",
    bpDiastolic: "",
    spo2: "",
    pain: "",
    alteredConsciousness: false,
    documentId: "",
    sex: "",
    phone: "",
    companion: "",
    allergies: "",
    religion: "",
    bloodType: "",
    arrivedAt: toDateTimeLocalValue(Date.now()),
  }));
  const [fieldErrors, setFieldErrors] = useState({});

  const ctasSuggestion = useMemo(() => {
    const chief =
      form.chiefComplaintCode || (form.fastTrack ? "other" : "");
    if (!chief && !form.fastTrack) return null;

    const t = parseTempInput(form.temp);
    const fcRaw = form.fc === "" || form.fc == null ? "" : String(form.fc).trim();
    const f = fcRaw === "" ? NaN : Number(fcRaw.replace(",", "."));
    const fr = parseIntOrNaN(form.respiratoryRate);
    const sys = parseIntOrNaN(form.bpSystolic);
    const dia = parseIntOrNaN(form.bpDiastolic);
    const ageRaw = form.age === "" || form.age == null ? "" : String(form.age).trim();
    const age = ageRaw === "" ? 0 : Number(ageRaw);

    if (
      !Number.isFinite(t) ||
      !Number.isFinite(f) ||
      !Number.isInteger(f) ||
      !Number.isFinite(fr) ||
      !Number.isFinite(sys) ||
      !Number.isFinite(dia)
    ) {
      return null;
    }
    const spo2Raw = form.spo2 === "" || form.spo2 == null ? "" : String(form.spo2).trim();
    const spo2 = spo2Raw === "" ? null : Number(spo2Raw);
    const painRaw = form.pain === "" || form.pain == null ? "" : String(form.pain).trim();
    const pain = painRaw === "" ? null : Number(painRaw);

    return suggestCtasLevel({
      chiefComplaintCode: chief,
      redFlags: form.redFlags,
      fastTrack: form.fastTrack,
      age,
      temp: t,
      fc: f,
      vitals: {
        spo2: Number.isFinite(spo2) ? spo2 : null,
        pain: Number.isFinite(pain) ? pain : null,
        alteredConsciousness: form.alteredConsciousness,
        respiratoryRate: fr,
        bpSystolic: sys,
        bpDiastolic: dia,
      },
    });
  }, [form]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const submit = async () => {
    if (!canCreatePatient) {
      return toast.error("Tu rol no puede registrar pacientes");
    }

    const result = validateTriageForm(form, { fastTrack: form.fastTrack });
    if (!result.valid) {
      setFieldErrors(result.errors);
      toast.error("Revisa los campos marcados.");
      return;
    }

    setFieldErrors({});

    const suggestion = suggestCtasLevel({
      chiefComplaintCode: result.values.chiefComplaintCode,
      redFlags: result.values.redFlags,
      fastTrack: result.values.fastTrack,
      age: result.values.age,
      temp: result.values.temp,
      fc: result.values.fc,
      vitals: {
        spo2: result.values.spo2,
        pain: result.values.pain,
        alteredConsciousness: result.values.alteredConsciousness,
        respiratoryRate: result.values.respiratoryRate,
        bpSystolic: result.values.bpSystolic,
        bpDiastolic: result.values.bpDiastolic,
      },
    });

    const assigned = triageAssigned || suggestion.level;
    const assignmentCheck = validateTriageAssignment({
      suggested: suggestion.level,
      assigned,
      overrideReasonCode,
      overrideNote,
    });
    if (!assignmentCheck.valid) {
      setAssignmentError(assignmentCheck.error);
      toast.error(assignmentCheck.error);
      return;
    }
    setAssignmentError("");

    try {
      await addPatient({
        ...result.values,
        arrivedAt: result.values.arrivedAt,
        fastTrack: result.values.fastTrack,
        triageAssigned: assigned,
        overrideReasonCode,
        overrideNote,
      });
      toast.success(
        `Paciente registrado — CTAS ${assigned} (sugerido ${suggestion.level})${result.values.fastTrack ? " · ingreso mínimo" : ""}`
      );
      setTriageAssigned("");
      setOverrideReasonCode("");
      setOverrideNote("");
      setForm({
        fastTrack: false,
        chiefComplaintCode: "",
        redFlags: [],
        name: "",
        age: "",
        symptom: "",
        temp: "",
        fc: "",
        respiratoryRate: "",
        bpSystolic: "",
        bpDiastolic: "",
        spo2: "",
        pain: "",
        alteredConsciousness: false,
        documentId: "",
        sex: "",
        phone: "",
        companion: "",
        allergies: "",
        religion: "",
        bloodType: "",
        arrivedAt: toDateTimeLocalValue(Date.now()),
      });
      setFieldErrors({});
    } catch (err) {
      toast.error(err?.message || "No se pudo registrar el paciente");
    }
  };

  const toggleRedFlag = (code) => {
    setForm((prev) => {
      const set = new Set(prev.redFlags);
      if (set.has(code)) set.delete(code);
      else set.add(code);
      return { ...prev, redFlags: [...set] };
    });
  };

  const fast = form.fastTrack;

  const cancelRegistration = () => {
    navigate("/dashboard");
  };

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/50 dark:text-brand-200">
            <Stethoscope className="h-3 w-3" />
            Registro de triage
          </span>
          <h1 className="page-title mt-2" data-testid="triage-page-title">
            Registrar paciente
          </h1>
          </div>
          <button
            type="button"
            onClick={cancelRegistration}
            data-testid="triage-cancel"
            className="btn btn-secondary shrink-0 self-start"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al dashboard
          </button>
        </div>

        {/* Fast track */}
        <label className="card card-hover flex cursor-pointer items-start gap-3 border-amber-200/70 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30">
          <input
            data-testid="triage-fast-track"
            type="checkbox"
            className="mt-1 h-4 w-4 accent-amber-500"
            checked={fast}
            onChange={(e) => updateField("fastTrack", e.target.checked)}
          />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Ingreso mínimo (crítico / sin datos completos)
            </p>
            <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/90">
              Prioriza vitales y seguridad: no exige documento ni datos de
              contacto al instante. Podrán completarse después en el detalle
              del paciente.
            </p>
          </div>
        </label>

        {fast ? (
          <div
            className="card flex gap-3 border-red-200/80 bg-red-50/80 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100"
            role="status"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <p className="mt-1">
              <strong>Modo urgencia:</strong> nombre y síntoma pueden quedar
              genéricos; completa temperatura, FC, frecuencia respiratoria y
              presión arterial.
            </p>
          </div>
        ) : null}

        {/* Motivo CTAS */}
        {!fast ? (
          <section className="card space-y-4">
            <SectionHeader
              title="Motivo de consulta (CTAS)"
              description="Seleccione la presentación principal; la sugerencia combina motivo, discriminadores y signos vitales."
            />
            <Field
              label="Presentación principal"
              error={fieldErrors.chiefComplaintCode}
            >
              <select
                data-testid="triage-chief-complaint"
                className="input w-full"
                value={form.chiefComplaintCode}
                onChange={(e) =>
                  updateField("chiefComplaintCode", e.target.value)
                }
              >
                <option value="">Seleccione motivo…</option>
                {CTAS_CHIEF_COMPLAINTS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="space-y-2">
              <p className="form-label">Discriminadores / banderas rojas</p>
                <div className="grid gap-2 sm:grid-cols-2">
                {CTAS_RED_FLAGS.map((flag) => (
                  <label
                    key={flag.code}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-ink-200/80 px-3 py-2 text-xs dark:border-ink-700"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-red-600"
                      checked={form.redFlags.includes(flag.code)}
                      onChange={() => toggleRedFlag(flag.code)}
                    />
                    <span>{flag.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Datos del paciente */}
        <section className="card space-y-4">
          <SectionHeader
            title="Datos del paciente"
            description="Identificación básica y momento de llegada."
          />
          <Field label="Hora de llegada a urgencias" error={fieldErrors.arrivedAt}>
            <input
              data-testid="triage-arrived-at"
              type="datetime-local"
              className="input w-full"
              value={form.arrivedAt}
              onChange={(e) => updateField("arrivedAt", e.target.value)}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            {!fast ? (
              <>
                <Field label="Nombre completo" error={fieldErrors.name}>
                  <input
                    data-testid="triage-name"
                    className="input w-full"
                    placeholder="Ej. María García"
                    value={form.name}
                    autoComplete="name"
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </Field>
                <Field label="Edad (años)" error={fieldErrors.age}>
                  <input
                    data-testid="triage-age"
                    className="input w-full"
                    inputMode="numeric"
                    placeholder="Ej. 42"
                    value={form.age}
                    onChange={(e) => updateField("age", e.target.value)}
                  />
                </Field>
                <Field
                  label="Síntoma principal"
                  error={fieldErrors.symptom}
                >
                  <input
                    data-testid="triage-symptom"
                    className="input w-full"
                    placeholder="Ej. Fiebre, dolor abdominal…"
                    value={form.symptom}
                    onChange={(e) => updateField("symptom", e.target.value)}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Nombre (opcional)" error={fieldErrors.name}>
                  <input
                    data-testid="triage-name"
                    className="input w-full"
                    placeholder='Vacío → "Paciente sin identificar"'
                    value={form.name}
                    autoComplete="name"
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </Field>
                <Field label="Edad (opcional)" error={fieldErrors.age}>
                  <input
                    data-testid="triage-age"
                    className="input w-full"
                    inputMode="numeric"
                    placeholder="Vacío → sin especificar"
                    value={form.age}
                    onChange={(e) => updateField("age", e.target.value)}
                  />
                </Field>
                <Field
                  label="Síntoma (opcional)"
                  error={fieldErrors.symptom}
                >
                  <input
                    data-testid="triage-symptom"
                    className="input w-full"
                    placeholder='Vacío → "Crítico / datos incompletos"'
                    value={form.symptom}
                    onChange={(e) => updateField("symptom", e.target.value)}
                  />
                </Field>
              </>
            )}
          </div>
        </section>

        {/* Vitales */}
        <section className="card space-y-4">
          <SectionHeader title="Signos vitales y gravedad" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Temperatura (°C)" error={fieldErrors.temp}>
              <input
                data-testid="triage-temp"
                className="input w-full"
                inputMode="decimal"
                placeholder="Ej. 37.5"
                value={form.temp}
                onChange={(e) => updateField("temp", e.target.value)}
              />
            </Field>
            <Field label="Frecuencia cardíaca (lpm)" error={fieldErrors.fc}>
              <input
                data-testid="triage-fc"
                className="input w-full"
                inputMode="numeric"
                placeholder="Ej. 88"
                value={form.fc}
                onChange={(e) => updateField("fc", e.target.value)}
              />
            </Field>
            <Field
              label="Frecuencia respiratoria (rpm)"
              error={fieldErrors.respiratoryRate}
            >
              <input
                data-testid="triage-respiratory-rate"
                className="input w-full"
                inputMode="numeric"
                placeholder="Ej. 16"
                value={form.respiratoryRate}
                onChange={(e) => updateField("respiratoryRate", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-2">
              <Field
                label="TA sistólica (mmHg)"
                error={fieldErrors.bpSystolic}
              >
                <input
                  data-testid="triage-bp-systolic"
                  className="input w-full"
                  inputMode="numeric"
                  placeholder="Ej. 120"
                  value={form.bpSystolic}
                  onChange={(e) =>
                    updateField("bpSystolic", e.target.value)
                  }
                />
              </Field>
              <Field
                label="TA diastólica (mmHg)"
                error={fieldErrors.bpDiastolic}
              >
                <input
                  data-testid="triage-bp-diastolic"
                  className="input w-full"
                  inputMode="numeric"
                  placeholder="Ej. 80"
                  value={form.bpDiastolic}
                  onChange={(e) =>
                    updateField("bpDiastolic", e.target.value)
                  }
                />
              </Field>
            </div>
            <Field label="SpO₂ (%) — opcional" error={fieldErrors.spo2}>
              <input
                data-testid="triage-spo2"
                className="input w-full"
                inputMode="numeric"
                placeholder="Ej. 96"
                value={form.spo2}
                onChange={(e) => updateField("spo2", e.target.value)}
              />
            </Field>
            <Field label="Dolor EVA 0–10 — opcional" error={fieldErrors.pain}>
              <input
                data-testid="triage-pain"
                className="input w-full"
                inputMode="numeric"
                placeholder="0–10"
                value={form.pain}
                onChange={(e) => updateField("pain", e.target.value)}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm transition hover:border-brand-400 dark:border-ink-700 dark:bg-ink-800/60">
            <input
              data-testid="triage-altered-consciousness"
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={form.alteredConsciousness}
              onChange={(e) =>
                updateField("alteredConsciousness", e.target.checked)
              }
            />
            <span className="text-ink-700 dark:text-ink-200">
              Alteración del nivel de conciencia
            </span>
          </label>
        </section>

        {/* Identificación */}
        {!fast ? (
          <section className="card space-y-4">
            <SectionHeader
              title="Identificación"
              description="Opcional al ingreso; puede completarse después en el detalle del paciente."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Documento" error={fieldErrors.documentId}>
                <input
                  data-testid="triage-document"
                  className="input w-full"
                  placeholder="ID / documento"
                  value={form.documentId}
                  onChange={(e) => updateField("documentId", e.target.value)}
                />
              </Field>
              <Field label="Sexo" error={fieldErrors.sex}>
                <select
                  data-testid="triage-sex"
                  className="input w-full"
                  value={form.sex}
                  onChange={(e) => updateField("sex", e.target.value)}
                >
                  <option value="">No indicado</option>
                  <option value="M">Mujer</option>
                  <option value="H">Hombre</option>
                  <option value="X">Otro / no binario</option>
                  <option value="N">Prefiero no indicar</option>
                </select>
              </Field>
              <Field label="Teléfono" error={fieldErrors.phone}>
                <input
                  data-testid="triage-phone"
                  className="input w-full"
                  inputMode="tel"
                  placeholder="Contacto"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </Field>
              <Field label="Acompañante" error={fieldErrors.companion}>
                <input
                  data-testid="triage-companion"
                  className="input w-full"
                  placeholder="Nombre o relación"
                  value={form.companion}
                  onChange={(e) => updateField("companion", e.target.value)}
                />
              </Field>
              <Field label="Religión — opcional" error={fieldErrors.religion}>
                <input
                  data-testid="triage-religion"
                  className="input w-full"
                  placeholder="Puede dejarse en blanco y completarse después"
                  value={form.religion}
                  onChange={(e) => updateField("religion", e.target.value)}
                />
              </Field>
              <Field label="Tipo de sangre — opcional" error={fieldErrors.bloodType}>
                <select
                  data-testid="triage-blood-type"
                  className="input w-full"
                  value={form.bloodType}
                  onChange={(e) => updateField("bloodType", e.target.value)}
                >
                  {BLOOD_TYPE_OPTIONS.map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Alergias" error={fieldErrors.allergies}>
                  <input
                    data-testid="triage-allergies"
                    className="input w-full"
                    placeholder="Medicamentos, alimentos…"
                    value={form.allergies}
                    onChange={(e) => updateField("allergies", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </section>
        ) : null}

        <TriageCtasAssignment
          suggestion={ctasSuggestion}
          triageAssigned={triageAssigned}
          onTriageAssignedChange={setTriageAssigned}
          overrideReasonCode={overrideReasonCode}
          onOverrideReasonChange={setOverrideReasonCode}
          overrideNote={overrideNote}
          onOverrideNoteChange={setOverrideNote}
          assignmentError={assignmentError}
        />

        <div
          className="card sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-10 flex flex-col gap-2 shadow-soft-lg sm:bottom-4 sm:flex-row sm:justify-end md:bottom-4"
          data-testid="triage-actions"
        >
          <button
            type="button"
            onClick={cancelRegistration}
            data-testid="triage-cancel-footer"
            className="btn btn-secondary w-full sm:w-auto"
          >
            Volver al dashboard
          </button>
          <button
            data-testid="triage-submit"
            type="button"
            onClick={submit}
            disabled={!canCreatePatient || !ctasSuggestion?.level}
            className="btn btn-primary w-full sm:w-auto"
          >
            Registrar paciente
          </button>
        </div>
      </div>
    </DataState>
  );
}
