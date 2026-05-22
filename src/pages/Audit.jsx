import { usePatients } from "../hooks/usePatients";
import { ClipboardList } from "lucide-react";
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

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      <div className="space-y-5">
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
