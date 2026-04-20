import { useCallback, useMemo } from "react";
import { usePatients } from "../hooks/usePatients";
import { usePostLoginPerf } from "../hooks/usePostLoginPerf";
import {
  Download,
  RotateCcw,
  ClipboardList,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  downloadTextFile,
  getAuditHistoryExportFilename,
  toCsvString,
} from "../utils/csv";
import { DataState } from "../components/DataState";

const TRIAGE_BADGE = {
  I: "badge-red",
  II: "badge-orange",
  III: "badge-amber",
  IV: "badge-lime",
  V: "badge-blue",
};

function actionAccent(action) {
  const a = String(action ?? "").toLowerCase();
  if (a.includes("creado")) return "bg-brand-500";
  if (a.includes("atención") || a.includes("atencion")) return "bg-amber-500";
  if (a.includes("finalizado")) return "bg-emerald-500";
  if (a.includes("actualizad") || a.includes("completad")) return "bg-sky-500";
  return "bg-ink-400";
}

export default function Audit() {
  const { history, loading, error, reload } = usePatients();
  const {
    summary: postLoginPerf,
    resetHistory: resetPostLoginPerfBase,
    downloadPostLoginPerfFile,
  } = usePostLoginPerf({ syncSummaryOnStorageEvents: true });

  const csvContent = useMemo(() => {
    const headers = ["Paciente", "Accion", "Triage", "Actor", "Fecha"];
    const rows = history.map((h) => [
      h.name ?? "",
      h.action ?? "",
      h.triage ?? "",
      h.actor ?? "",
      h.date ?? "",
    ]);
    return "\uFEFF" + toCsvString(headers, rows);
  }, [history]);

  const exportCsv = () => {
    if (!history.length) {
      toast.error("No hay eventos para exportar");
      return;
    }
    downloadTextFile(getAuditHistoryExportFilename(), csvContent);
    toast.success("CSV descargado");
  };

  const exportPostLoginPerfCsv = useCallback(() => {
    if (!downloadPostLoginPerfFile()) {
      toast.error("No hay datos de telemetría para exportar");
      return;
    }
    toast.success("CSV de telemetría descargado");
  }, [downloadPostLoginPerfFile]);

  const resetPostLoginPerf = useCallback(() => {
    resetPostLoginPerfBase();
    toast.success("Telemetría post-login reiniciada");
  }, [resetPostLoginPerfBase]);

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/50 dark:text-brand-200">
              <ClipboardList className="h-3 w-3" />
              Auditoría
            </span>
            <h1 className="page-title mt-2">Historial</h1>
            <p className="page-subtitle mt-1">
              Eventos de auditoría del sistema desde el inicio de operación.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!history.length}
            className="btn btn-primary"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        {/* Telemetría */}
        <section className="card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-950/40 dark:text-brand-200 dark:ring-brand-900/50">
                <Activity className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
                  Telemetría UX (post-login)
                </h2>
                <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                  Historial local del tiempo de transición tras iniciar sesión.
                </p>
                {postLoginPerf.samples > 0 ? (
                  <p
                    className="mt-2 text-xs text-ink-600 dark:text-ink-300"
                    data-testid="audit-post-login-summary"
                  >
                    Última: <strong>{postLoginPerf.lastMs} ms</strong> ·
                    Promedio: <strong>{postLoginPerf.avgMs} ms</strong> (
                    {postLoginPerf.samples} muestra(s))
                  </p>
                ) : (
                  <p
                    className="mt-2 text-xs text-ink-500 dark:text-ink-400"
                    data-testid="audit-post-login-empty"
                  >
                    Sin muestras aún (entra al dashboard tras un login para
                    registrar).
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={exportPostLoginPerfCsv}
                data-testid="audit-post-login-export"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar CSV
              </button>
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={resetPostLoginPerf}
                data-testid="audit-post-login-reset"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpiar
              </button>
            </div>
          </div>
        </section>

        {/* Timeline de eventos */}
        {history.length === 0 ? (
          <div className="card text-center text-sm text-ink-500 dark:text-ink-400">
            No hay eventos registrados.
          </div>
        ) : (
          <div className="relative space-y-3">
            <div
              className="pointer-events-none absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-ink-200 via-ink-200 to-transparent dark:from-ink-700 dark:via-ink-700"
              aria-hidden
            />
            {history.map((h, i) => (
              <div
                key={`${h.date}-${h.name}-${h.action}-${i}`}
                className="relative ml-0 flex gap-4"
              >
                <span
                  className={`relative z-10 mt-4 h-3 w-3 shrink-0 rounded-full ring-4 ring-white dark:ring-ink-950 ${actionAccent(
                    h.action
                  )}`}
                />
                <div className="card flex-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                        {h.name || "—"}
                      </p>
                      <p className="text-xs text-ink-600 dark:text-ink-300">
                        {h.action}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {h.triage != null && h.triage !== "" && (
                        <span
                          className={`badge ${
                            TRIAGE_BADGE[h.triage] ?? "badge-slate"
                          }`}
                        >
                          CTAS {h.triage}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500 dark:text-ink-400">
                    {h.actor ? <span>Actor: {h.actor}</span> : null}
                    <span>{h.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DataState>
  );
}
