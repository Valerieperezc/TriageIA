import { useMemo, useState } from "react";
import { usePatients } from "../hooks/usePatients";
import toast from "react-hot-toast";
import { calculateTriage } from "../utils/triage";
import { parseTempInput, validateTriageForm } from "../utils/triageFormValidation";
import { DataState } from "../components/DataState";
import { AlertTriangle, Stethoscope } from "lucide-react";

const TRIAGE_PREVIEW_STYLES = {
  I: "badge-red",
  II: "badge-orange",
  III: "badge-amber",
  IV: "badge-lime",
  V: "badge-blue",
};

const TRIAGE_PREVIEW_LABEL = {
  I: "Resucitación (crítico)",
  II: "Emergente",
  III: "Urgente",
  IV: "Menos urgente",
  V: "No urgente",
};

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

export default function Triage() {
  const { addPatient, canCreatePatient, loading, error, reload } = usePatients();

  const [form, setForm] = useState(() => ({
    fastTrack: false,
    name: "",
    age: "",
    symptom: "",
    temp: "",
    fc: "",
    spo2: "",
    pain: "",
    alteredConsciousness: false,
    respiratoryDistress: false,
    documentId: "",
    sex: "",
    phone: "",
    companion: "",
    allergies: "",
    arrivedAt: toDateTimeLocalValue(Date.now()),
  }));
  const [fieldErrors, setFieldErrors] = useState({});

  const previewTriage = useMemo(() => {
    const t = parseTempInput(form.temp);
    const fcRaw = form.fc === "" || form.fc == null ? "" : String(form.fc).trim();
    const f = fcRaw === "" ? NaN : Number(fcRaw.replace(",", "."));
    if (!Number.isFinite(t) || !Number.isFinite(f) || !Number.isInteger(f)) {
      return null;
    }
    const spo2Raw = form.spo2 === "" || form.spo2 == null ? "" : String(form.spo2).trim();
    const spo2 = spo2Raw === "" ? null : Number(spo2Raw);
    const painRaw = form.pain === "" || form.pain == null ? "" : String(form.pain).trim();
    const pain = painRaw === "" ? null : Number(painRaw);
    return calculateTriage(t, f, {
      spo2: Number.isFinite(spo2) ? spo2 : null,
      pain: Number.isFinite(pain) ? pain : null,
      alteredConsciousness: form.alteredConsciousness,
      respiratoryDistress: form.respiratoryDistress,
    });
  }, [
    form.temp,
    form.fc,
    form.spo2,
    form.pain,
    form.alteredConsciousness,
    form.respiratoryDistress,
  ]);

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

    try {
      const triageLevel = calculateTriage(result.values.temp, result.values.fc, {
        spo2: result.values.spo2,
        pain: result.values.pain,
        alteredConsciousness: result.values.alteredConsciousness,
        respiratoryDistress: result.values.respiratoryDistress,
      });
      await addPatient({
        ...result.values,
        arrivedAt: result.values.arrivedAt,
        fastTrack: result.values.fastTrack,
      });
      toast.success(
        `Paciente registrado — triage ${triageLevel}${result.values.fastTrack ? " (ingreso mínimo)" : ""}`
      );
      setForm({
        fastTrack: false,
        name: "",
        age: "",
        symptom: "",
        temp: "",
        fc: "",
        spo2: "",
        pain: "",
        alteredConsciousness: false,
        respiratoryDistress: false,
        documentId: "",
        sex: "",
        phone: "",
        companion: "",
        allergies: "",
        arrivedAt: toDateTimeLocalValue(Date.now()),
      });
      setFieldErrors({});
    } catch (err) {
      toast.error(err?.message || "No se pudo registrar el paciente");
    }
  };

  const triageLabel = previewTriage;
  const fast = form.fastTrack;

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Header */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/50 dark:text-brand-200">
            <Stethoscope className="h-3 w-3" />
            Registro de triage
          </span>
          <h1 className="page-title mt-2">Registrar paciente</h1>
          <p className="page-subtitle mt-1">
            Triage ampliado con signos vitales y criterios de gravedad.
            Temperatura en °C y frecuencia cardíaca en lpm.
          </p>
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
              genéricos; completa temperatura y FC.
            </p>
          </div>
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
          <SectionHeader
            title="Signos y gravedad"
            description="Campos marcados como opcionales mejoran la clasificación."
          />
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

          <div className="grid gap-2 md:grid-cols-2">
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
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm transition hover:border-brand-400 dark:border-ink-700 dark:bg-ink-800/60">
              <input
                data-testid="triage-respiratory-distress"
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={form.respiratoryDistress}
                onChange={(e) =>
                  updateField("respiratoryDistress", e.target.checked)
                }
              />
              <span className="text-ink-700 dark:text-ink-200">
                Dificultad respiratoria evidente
              </span>
            </label>
          </div>
        </section>

        {/* Identificación */}
        {!fast ? (
          <section className="card space-y-4">
            <SectionHeader
              title="Identificación"
              description="Opcional al ingreso; puede completarse después."
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

        {/* Preview + submit */}
        <div className="card sticky bottom-4 flex flex-col gap-3 shadow-soft-lg sm:flex-row sm:items-center sm:justify-between">
          {triageLabel ? (
            <div
              data-testid="triage-preview"
              className="flex items-center gap-3"
            >
              <span className={`badge ${TRIAGE_PREVIEW_STYLES[triageLabel] ?? "badge-slate"}`}>
                CTAS {triageLabel}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                  Clasificación prevista
                </p>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  {TRIAGE_PREVIEW_LABEL[triageLabel]}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Completa temperatura y FC para ver la clasificación prevista.
            </p>
          )}

          <button
            data-testid="triage-submit"
            type="button"
            onClick={submit}
            disabled={!canCreatePatient}
            className="btn btn-primary w-full sm:w-auto"
          >
            Registrar paciente
          </button>
        </div>
      </div>
    </DataState>
  );
}
