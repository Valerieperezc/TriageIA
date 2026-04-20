import { useEffect, useMemo, useState } from "react";
import { usePatients } from "../hooks/usePatients";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { filterPatients } from "../utils/patientFilters";
import { DataState } from "../components/DataState";
import { buildPatientsCsv } from "../utils/patientCsv";
import { downloadTextFile } from "../utils/csv";
import { paginateSlice } from "../utils/pagination";
import { parseSortParam, sortPatients } from "../utils/patientSort";
import { minutesWaiting } from "../utils/dashboardMetrics";

const PAGE_SIZE = 15;

const TRIAGE_BADGE = {
  I: "badge-red",
  II: "badge-orange",
  III: "badge-amber",
  IV: "badge-lime",
  V: "badge-blue",
};

const TRIAGE_BORDER = {
  I: "border-l-red-500",
  II: "border-l-orange-500",
  III: "border-l-amber-500",
  IV: "border-l-lime-500",
  V: "border-l-sky-500",
};

const STATUS_BADGE = {
  "En espera": "badge-amber",
  "En atención": "badge-brand",
  Finalizado: "badge-green",
};

export default function Patients() {
  const { patients, loading, error, reload } = usePatients();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [now, setNow] = useState(() => Date.now());
  const [search, setSearch] = useState("");

  const triage = searchParams.get("triage");
  const sortMode = parseSortParam(searchParams.get("sort"));
  const pageRaw = parseInt(searchParams.get("page") || "1", 10);
  const pageFromUrl = Number.isFinite(pageRaw) ? pageRaw : 1;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(
    () => filterPatients(patients, { triage, search }),
    [patients, triage, search]
  );

  const sorted = useMemo(
    () => sortPatients(filtered, sortMode, now),
    [filtered, sortMode, now]
  );

  const { pageNum, totalPages, rows, rangeStart, rangeEnd, total } =
    paginateSlice(sorted, pageFromUrl, PAGE_SIZE);

  useEffect(() => {
    if (pageFromUrl !== pageNum) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("page", String(pageNum));
          return next;
        },
        { replace: true }
      );
    }
  }, [pageFromUrl, pageNum, setSearchParams]);

  const setTriageFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("triage", value);
    } else {
      next.delete("triage");
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const setSortFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "triage") {
      next.set("sort", value);
    } else {
      next.delete("sort");
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearch(v);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", "1");
        return next;
      },
      { replace: true }
    );
  };

  const goToPage = (n) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(n));
      return next;
    });
  };

  const exportCsv = () => {
    if (!sorted.length) {
      toast.error("No hay filas para exportar");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const csv = buildPatientsCsv(sorted, now);
    downloadTextFile(`triageia-pacientes-${stamp}.csv`, csv);
    toast.success("CSV descargado (vista actual)");
  };

  const triageChips = [
    { value: "", label: "Todos" },
    { value: "I", label: "I" },
    { value: "II", label: "II" },
    { value: "III", label: "III" },
    { value: "IV", label: "IV" },
    { value: "V", label: "V" },
  ];

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/50 dark:text-brand-200">
              <Users className="h-3 w-3" />
              Gestión de pacientes
            </span>
            <h1 className="page-title mt-2">Pacientes</h1>
            <p className="page-subtitle mt-1">
              Búsqueda, filtrado y exportación del histórico de registros.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!sorted.length}
            className="btn btn-primary"
          >
            <Download className="h-4 w-4" />
            Exportar CSV (vista actual)
          </button>
        </div>

        {/* Filtros */}
        <div className="card space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <div>
              <label className="form-label">Buscar</label>
              <div className="input">
                <Search className="h-4 w-4 text-ink-400 dark:text-ink-500" />
                <input
                  placeholder="Nombre o síntoma"
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Ordenar por</label>
              <select
                className="input min-w-[220px]"
                value={sortMode}
                onChange={(e) => setSortFilter(e.target.value)}
              >
                <option value="triage">Prioridad triage (I primero)</option>
                <option value="wait-desc">Tiempo de espera (mayor primero)</option>
                <option value="wait-asc">Tiempo de espera (menor primero)</option>
                <option value="name">Nombre (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="section-title mr-1">Triage:</span>
            {triageChips.map((chip) => {
              const isActive = (triage || "") === chip.value;
              return (
                <button
                  key={chip.value || "all"}
                  type="button"
                  onClick={() => setTriageFilter(chip.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? "border-brand-500 bg-brand-gradient text-white shadow-soft-sm"
                      : "border-ink-200 bg-white text-ink-600 hover:border-brand-400 hover:text-brand-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:text-brand-300"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info resultados */}
        {sorted.length === 0 && (
          <div className="card text-center text-sm text-ink-500 dark:text-ink-400">
            No hay pacientes con estos filtros.
          </div>
        )}

        {sorted.length > 0 && (
          <p
            className="text-sm text-ink-600 dark:text-ink-300"
            data-testid="patients-page-info"
          >
            Mostrando <strong>{rangeStart}–{rangeEnd}</strong> de{" "}
            <strong>{total}</strong> (página {pageNum} de {totalPages})
          </p>
        )}

        {/* Lista */}
        {rows.length > 0 ? (
          <div className="space-y-2">
            {rows.map((p) => {
              const minutes = minutesWaiting(p, now);
              const triageCls = TRIAGE_BORDER[p.triage] ?? "border-l-ink-300";
              const triageBadge = TRIAGE_BADGE[p.triage] ?? "badge-slate";
              const statusBadge = STATUS_BADGE[p.status] ?? "badge-slate";

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => nav(`/patient/${p.id}`)}
                  className={`flex w-full items-center gap-3 rounded-xl border border-ink-200/70 border-l-4 bg-white/80 p-4 text-left shadow-soft-sm transition hover:-translate-y-0.5 hover:shadow-soft dark:border-ink-700 dark:bg-ink-900/60 ${triageCls}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
                        {p.name}
                      </p>
                      <span className={`badge ${triageBadge}`}>
                        CTAS {p.triage}
                      </span>
                      <span className={`badge ${statusBadge}`}>{p.status}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-ink-500 dark:text-ink-400">
                      {p.symptom || "Sin síntoma registrado"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                      {minutes} min
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                      en espera
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {total > 0 && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => goToPage(pageNum - 1)}
              disabled={pageNum <= 1}
              className="btn btn-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Página {pageNum} / {totalPages}
            </p>
            <button
              type="button"
              onClick={() => goToPage(pageNum + 1)}
              disabled={pageNum >= totalPages}
              className="btn btn-secondary"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </DataState>
  );
}
