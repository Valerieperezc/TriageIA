import { useParams, Link } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { DataState } from "../components/DataState";
import { minutesWaiting } from "../utils/dashboardMetrics";
import {
  canTransitionStatus,
  isTerminalStatus,
  PATIENT_STATUS,
} from "../utils/patientStatus";
import { ArrowLeft, CheckCircle2, Lock, PlayCircle, Clock } from "lucide-react";

const TRIAGE_BADGE = {
  I: "badge-red",
  II: "badge-orange",
  III: "badge-amber",
  IV: "badge-lime",
  V: "badge-blue",
};

const STATUS_BADGE = {
  "En espera": "badge-amber",
  "En atención": "badge-brand",
  Finalizado: "badge-green",
};

function fmt(ts) {
  if (ts == null || !Number.isFinite(ts)) return "—";
  return new Date(ts).toLocaleString();
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-ink-200/60 bg-white/70 px-3 py-2 text-sm shadow-soft-sm dark:border-ink-700 dark:bg-ink-800/50">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
        {label}
      </span>
      <span className="min-w-0 text-right font-medium text-ink-800 dark:text-ink-100">
        {value ?? "—"}
      </span>
    </div>
  );
}

function DemographicsEditor({ patient, onPatch, onSaved }) {
  const [demo, setDemo] = useState(() => ({
    name: patient.name ?? "",
    age: String(patient.age ?? ""),
    documentId: patient.documentId ?? "",
    sex: patient.sex ?? "",
    phone: patient.phone ?? "",
    companion: patient.companion ?? "",
    allergies: patient.allergies ?? "",
  }));

  const saveDemographics = async () => {
    const ageNum = Number.parseInt(String(demo.age).trim(), 10);
    const patch = {
      name: demo.name.trim() || patient.name,
      age: Number.isFinite(ageNum) ? ageNum : patient.age,
      documentId: demo.documentId.trim() || null,
      sex: demo.sex.trim() || null,
      phone: demo.phone.trim() || null,
      companion: demo.companion.trim() || null,
      allergies: demo.allergies.trim() || null,
    };
    try {
      await onPatch(patch);
      toast.success("Datos guardados");
      onSaved();
    } catch (e) {
      toast.error(e?.message || "No se pudieron guardar los datos");
    }
  };

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
          Completar o corregir datos
        </h2>
        <p className="text-xs text-ink-500 dark:text-ink-400">
          Información identificativa y de contacto del paciente.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="form-label">Nombre</label>
          <input
            data-testid="patient-demo-name"
            className="input w-full"
            value={demo.name}
            onChange={(e) => setDemo((d) => ({ ...d, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Edad</label>
          <input
            data-testid="patient-demo-age"
            className="input w-full"
            inputMode="numeric"
            value={demo.age}
            onChange={(e) => setDemo((d) => ({ ...d, age: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Documento</label>
          <input
            data-testid="patient-demo-document"
            className="input w-full"
            value={demo.documentId}
            onChange={(e) =>
              setDemo((d) => ({ ...d, documentId: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="form-label">Sexo</label>
          <select
            data-testid="patient-demo-sex"
            className="input w-full"
            value={demo.sex}
            onChange={(e) => setDemo((d) => ({ ...d, sex: e.target.value }))}
          >
            <option value="">No indicado</option>
            <option value="M">Mujer</option>
            <option value="H">Hombre</option>
            <option value="X">Otro / no binario</option>
            <option value="N">Prefiero no indicar</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">Teléfono</label>
          <input
            data-testid="patient-demo-phone"
            className="input w-full"
            inputMode="tel"
            value={demo.phone}
            onChange={(e) =>
              setDemo((d) => ({ ...d, phone: e.target.value }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">Acompañante</label>
          <input
            data-testid="patient-demo-companion"
            className="input w-full"
            value={demo.companion}
            onChange={(e) =>
              setDemo((d) => ({ ...d, companion: e.target.value }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">Alergias</label>
          <input
            data-testid="patient-demo-allergies"
            className="input w-full"
            value={demo.allergies}
            onChange={(e) =>
              setDemo((d) => ({ ...d, allergies: e.target.value }))
            }
          />
        </div>
      </div>

      <button
        data-testid="patient-demo-save"
        type="button"
        className="btn btn-secondary"
        onClick={saveDemographics}
      >
        Guardar datos
      </button>
    </section>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const {
    patients,
    updateStatus,
    patchPatientDemographics,
    canSetInAttention,
    canFinalizePatient,
    canUpdateDemographics,
    loading,
    error,
    reload,
  } = usePatients();

  const [now, setNow] = useState(() => Date.now());
  const [demoFormKey, setDemoFormKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const p = patients.find((patient) => patient.id === id);

  if (loading) {
    return <DataState loading error={null} />;
  }

  if (error) {
    return <DataState loading={false} error={error} onRetry={reload} />;
  }

  if (!p) {
    return (
      <div className="card mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-bold">Paciente no encontrado</h1>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          El identificador no coincide con ningún registro o ya no está
          disponible.
        </p>
        <Link to="/patients" className="btn btn-primary inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Volver a pacientes
        </Link>
      </div>
    );
  }

  const waitMin = minutesWaiting(p, now);
  const triageBadge = TRIAGE_BADGE[p.triage] ?? "badge-slate";
  const statusBadge = STATUS_BADGE[p.status] ?? "badge-slate";

  const finalized = isTerminalStatus(p.status);
  const canMoveToAttention =
    canSetInAttention && canTransitionStatus(p.status, PATIENT_STATUS.IN_ATTENTION);
  const canMoveToFinalized =
    canFinalizePatient && canTransitionStatus(p.status, PATIENT_STATUS.FINALIZED);

  const attendBlockedReason = !canSetInAttention
    ? "Tu rol no puede pasar pacientes a 'En atención'."
    : finalized
      ? "El paciente ya fue finalizado. Si necesita atención, regístralo como un nuevo ingreso."
      : p.status === PATIENT_STATUS.IN_ATTENTION
        ? "El paciente ya está en atención."
        : "";

  const finalizeBlockedReason = !canFinalizePatient
    ? "Tu rol no puede finalizar pacientes."
    : finalized
      ? "El paciente ya está finalizado."
      : "";

  const setStatus = async (status) => {
    try {
      await updateStatus(id, status);
      toast.success("Estado actualizado");
    } catch (e) {
      toast.error(e?.message || "No se pudo actualizar el estado");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        to="/patients"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pacientes
      </Link>

      {/* Header */}
      <section className="card space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="page-title">{p.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`badge ${triageBadge}`}>CTAS {p.triage}</span>
              <span
                className={`badge ${statusBadge}`}
                data-testid="patient-detail-status"
              >
                {p.status}
              </span>
              {p.fastTrack ? (
                <span className="badge badge-amber">Ingreso mínimo</span>
              ) : null}
              <span className="badge badge-slate">
                <Clock className="mr-1 h-3 w-3" />
                <span data-testid="patient-wait-minutes">
                  {waitMin} min en espera
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              data-testid="patient-status-attend"
              type="button"
              onClick={() => setStatus("En atención")}
              disabled={!canMoveToAttention}
              title={attendBlockedReason || "Pasar a En atención"}
              className="btn btn-warning"
            >
              <PlayCircle className="h-4 w-4" />
              Atender
            </button>
            <button
              data-testid="patient-status-finalize"
              type="button"
              onClick={() => setStatus("Finalizado")}
              disabled={!canMoveToFinalized}
              title={finalizeBlockedReason || "Finalizar atención"}
              className="btn btn-success"
            >
              <CheckCircle2 className="h-4 w-4" />
              Finalizar
            </button>
          </div>
        </div>

        {finalized && (
          <div
            data-testid="patient-finalized-banner"
            className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100"
            role="status"
          >
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Este paciente ya fue finalizado. Para atenderlo de nuevo, registra
              un nuevo ingreso.
            </span>
          </div>
        )}
      </section>

      {/* Dos columnas: tiempos + clínico */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-3">
          <div>
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
              Tiempos
            </h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Cronología del paciente en el sistema.
            </p>
          </div>
          <div className="space-y-2">
            <InfoRow label="Llegada a urgencias" value={fmt(p.arrivedAt)} />
            <InfoRow label="Registro en sistema" value={fmt(p.createdAt)} />
            <InfoRow label="Primera atención" value={fmt(p.firstAttentionAt)} />
            <InfoRow label="Espera (desde llegada)" value={`${waitMin} min`} />
          </div>
        </section>

        <section className="card space-y-3">
          <div>
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
              Datos clínicos
            </h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Información de triage registrada.
            </p>
          </div>
          <div className="space-y-2">
            <InfoRow label="Edad" value={p.age} />
            <InfoRow label="Síntoma" value={p.symptom} />
            <InfoRow
              label="Temperatura / FC"
              value={`${p.temp} °C · ${p.fc} lpm`}
            />
            {(p.spo2 != null || p.pain != null) && (
              <InfoRow
                label="SpO₂ / Dolor"
                value={`${p.spo2 != null ? `${p.spo2} %` : "—"} · ${
                  p.pain != null ? `EVA ${p.pain}` : "—"
                }`}
              />
            )}
            {(p.alteredConsciousness || p.respiratoryDistress) && (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm dark:border-red-900/60 dark:bg-red-950/40">
                <span className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                  Alertas
                </span>
                <span className="text-right font-medium text-red-800 dark:text-red-200">
                  {[
                    p.alteredConsciousness && "Alteración de conciencia",
                    p.respiratoryDistress && "Disnea",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {canUpdateDemographics && (
        <DemographicsEditor
          key={`${p.id}-${demoFormKey}`}
          patient={p}
          onPatch={(patch) => patchPatientDemographics(id, patch)}
          onSaved={() => setDemoFormKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
