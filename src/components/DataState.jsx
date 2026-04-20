import { AlertOctagon, RefreshCcw } from "lucide-react";

export function DataState({ loading, error, onRetry, children }) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="card animate-pulse space-y-3">
          <div className="h-6 w-56 rounded-lg bg-ink-200/80 dark:bg-ink-700/80" />
          <div className="h-4 w-full max-w-md rounded bg-ink-200/60 dark:bg-ink-700/60" />
          <div className="h-4 w-3/4 rounded bg-ink-200/60 dark:bg-ink-700/60" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="card animate-pulse space-y-2">
              <div className="h-3 w-24 rounded bg-ink-200/70 dark:bg-ink-700/70" />
              <div className="h-7 w-16 rounded bg-ink-200/80 dark:bg-ink-700/80" />
              <div className="h-3 w-32 rounded bg-ink-200/60 dark:bg-ink-700/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200/80 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shadow-soft">
              <AlertOctagon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-100">
                No se pudieron cargar los datos
              </p>
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn btn-danger self-start sm:self-auto"
            >
              <RefreshCcw className="h-4 w-4" />
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return children ?? null;
}
