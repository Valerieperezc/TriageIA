import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePatients } from "../hooks/usePatients";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { DataState } from "../components/DataState";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Clock,
  ListTree,
  MinusCircle,
  Timer,
  Users,
} from "lucide-react";
import {
  computeQueueMetrics,
  filterPatientsOfDay,
  minutesWaiting,
  waitReferenceMs,
} from "../utils/dashboardMetrics";
import { CRITICAL_ALARM_URL } from "../constants/alarm";
import { useSoundPreference } from "../hooks/useSoundPreference";
import { useAuth } from "../hooks/useAuth";
import { RoleWelcomeBanner } from "../components/RoleWelcomeBanner";
import { DashboardQuickActions } from "../components/DashboardQuickActions";
import {
  CtasDashboardCard,
  CtasLevelBadge,
  CtasUrgencyMessage,
} from "../components/CtasLevelDisplay";
import {
  getRoleWorkspaceSubtitle,
  getRoleWorkspaceTitle,
} from "../utils/roleConfig";

const DashboardTriageChart = lazy(() =>
  import("../components/DashboardTriageChart").then((module) => ({
    default: module.DashboardTriageChart,
  }))
);

/** CTAS: I (más urgente) … V (menos urgente) */
const TRIAGE_LEVELS = ["I", "II", "III", "IV", "V"];
const TRIAGE_ORDER = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
const TRIAGE_ROW_STYLES = {
  I: "border-red-500/70 bg-red-50/70 dark:bg-red-950/30",
  II: "border-orange-500/70 bg-orange-50/60 dark:bg-orange-950/20",
  III: "border-amber-400/80 bg-amber-50/60 dark:bg-amber-950/20",
  IV: "border-lime-500/70 bg-lime-50/60 dark:bg-lime-950/20",
  V: "border-sky-500/70 bg-sky-50/60 dark:bg-sky-950/20",
};
const TRIAGE_DOT_STYLES = {
  I: "bg-red-500 text-white",
  II: "bg-orange-500 text-white",
  III: "bg-amber-500 text-white",
  IV: "bg-lime-600 text-white",
  V: "bg-sky-500 text-white",
};
const TRIAGE_CARD_ICONS = [AlertTriangle, Clock, Activity, ListTree, MinusCircle];

function KpiCard({ icon: Icon, label, value, hint, accent = "brand", testid }) {
  const accentMap = {
    brand: "from-brand-500 to-brand-700 text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40",
    emerald:
      "from-emerald-500 to-emerald-700 text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40",
    amber:
      "from-amber-400 to-amber-600 text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40",
    red: "from-red-500 to-red-700 text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/40",
  };
  const classes = accentMap[accent] ?? accentMap.brand;
  const [gradFrom, gradTo, textClass, darkTextClass, bgClass, darkBgClass] =
    classes.split(" ");
  return (
    <div
      className="card card-hover relative overflow-hidden p-4"
      data-testid={testid}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${gradFrom} ${gradTo}`}
        aria-hidden
      />
      <div className="flex items-center gap-3 pl-2">
        <div
          className={`rounded-xl p-2.5 ${bgClass} ${darkBgClass} ${textClass} ${darkTextClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-ink-900 dark:text-ink-50">
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">
              {hint}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { patients, loading, error, reload, canCreatePatient, canSetInAttention } =
    usePatients();
  const { soundEnabled } = useSoundPreference();
  const navigate = useNavigate();
  const role = user?.role;
  const [now, setNow] = useState(() => Date.now());
  const prevCriticalInQueueRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const todaysPatients = useMemo(
    () => filterPatientsOfDay(patients, now),
    [patients, now]
  );

  const todayLabel = useMemo(
    () =>
      new Date(now).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [now]
  );

  const metrics = useMemo(
    () => computeQueueMetrics(todaysPatients, now),
    [todaysPatients, now]
  );

  useEffect(() => {
    const n = metrics.criticalInQueueCount;
    const prev = prevCriticalInQueueRef.current;
    prevCriticalInQueueRef.current = n;
    if (prev === null) return;
    if (n > prev) {
      if (soundEnabled) {
        const audio = new Audio(CRITICAL_ALARM_URL);
        audio.play().catch(() => null);
      }
      toast("Aumentó el número de pacientes críticos en espera", {
        duration: 5000,
      });
    }
  }, [metrics.criticalInQueueCount, soundEnabled]);

  const data = TRIAGE_LEVELS.map((level) => ({
    name: level,
    value: todaysPatients.filter((p) => p.triage === level).length,
  }));

  const waitingQueue = useMemo(() => {
    return todaysPatients
      .filter((p) => p.status === "En espera")
      .sort((a, b) => {
        const triageDiff =
          (TRIAGE_ORDER[a.triage] ?? Number.POSITIVE_INFINITY) -
          (TRIAGE_ORDER[b.triage] ?? Number.POSITIVE_INFINITY);
        if (triageDiff !== 0) return triageDiff;
        return waitReferenceMs(a, now) - waitReferenceMs(b, now);
      })
      .map((p, index) => ({
        ...p,
        queuePosition: index + 1,
        waitMinutes: minutesWaiting(p, now),
      }));
  }, [todaysPatients, now]);

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      <div className="space-y-6">
        <RoleWelcomeBanner />
        <DashboardQuickActions />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/50 dark:text-brand-200">
              <CalendarDays className="h-3 w-3" />
              Turno del día
            </span>
            <h1
              className="page-title mt-2"
              data-testid="dashboard-title"
            >
              {getRoleWorkspaceTitle(role)}
            </h1>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {getRoleWorkspaceSubtitle(role)}
            </p>
            <p
              className="mt-1 text-xs text-ink-400 dark:text-ink-500 capitalize"
              data-testid="dashboard-today-label"
            >
              {todayLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 self-start md:self-end">
            {canSetInAttention ? (
              <button
                type="button"
                onClick={() => navigate("/patients?sort=triage")}
                className="btn btn-secondary"
                data-testid="dashboard-go-queue"
              >
                Ver cola de atención
              </button>
            ) : null}
          </div>
        </div>

        {/* Alerta crítica */}
        {metrics.criticalInQueueCount > 0 && (
          <div
            data-testid="dashboard-critical-alert"
            className="card relative overflow-hidden border-red-300/70 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/50"
            role="alert"
          >
            <div
              className="absolute inset-y-0 left-0 w-1.5 bg-red-500"
              aria-hidden
            />
            <div className="flex flex-col gap-3 pl-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shadow-soft alert-pulse">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-100">
                    Pacientes críticos en espera
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-200">
                    {metrics.criticalInQueueCount} paciente(s) CTAS I sin
                    atender · Espera máxima:{" "}
                    {metrics.longestCriticalWaitMinutes} min
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/patients?triage=I")}
                className="btn btn-danger shrink-0 self-start sm:self-center"
              >
                Ver cola crítica
              </button>
            </div>
          </div>
        )}

        {/* KPIs cola */}
        <div
          data-testid="dashboard-queue-metrics"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          <KpiCard
            icon={Users}
            label="En cola (en espera)"
            value={metrics.waitingCount}
            hint="Pacientes del turno actual"
            accent="brand"
          />
          <KpiCard
            icon={Timer}
            label="Tiempo medio de espera"
            value={`${metrics.avgWaitMinutes} min`}
            hint="Promedio en cola hoy"
            accent="emerald"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Críticos CTAS I"
            value={metrics.criticalInQueueCount}
            hint="Pendientes de atención"
            accent="red"
          />
        </div>

        {/* Tarjetas CTAS */}
        <div>
          <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-50">
                Pacientes del día por CTAS
              </h2>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Total ingresados hoy:{" "}
                <span className="font-semibold text-ink-800 dark:text-ink-100">
                  {todaysPatients.length}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/patients")}
              className="btn btn-ghost text-sm"
            >
              Ver todos
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {TRIAGE_LEVELS.map((level, i) => {
              const Icon = TRIAGE_CARD_ICONS[i];
              return (
                <CtasDashboardCard
                  key={level}
                  level={level}
                  count={data[i].value}
                  icon={Icon}
                  onClick={() => navigate(`/patients?triage=${level}`)}
                />
              );
            })}
          </div>
        </div>

        {/* Orden de atención */}
        <div className="grid gap-4">
          <div
            className="card space-y-3"
            data-testid="dashboard-attention-order"
          >
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-50">
                  Orden de atención (hoy)
                </h2>
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  Basado en prioridad CTAS y tiempo de espera · Los turnos se
                  reinician cada día, el historial completo permanece en
                  Historial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/patients?sort=triage")}
                className="btn btn-secondary shrink-0 self-start text-xs sm:self-center"
              >
                Ver lista completa
              </button>
            </div>

            {waitingQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/70 p-6 text-center dark:border-ink-700 dark:bg-ink-800/40">
                <p className="text-sm font-medium text-ink-600 dark:text-ink-300">
                  No hay pacientes en espera
                </p>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                  Cuando registres un paciente aparecerá aquí como turno 1.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {waitingQueue.slice(0, 8).map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => navigate(`/patient/${patient.id}`)}
                    className={`flex w-full items-center gap-3 rounded-xl border-l-4 bg-white/80 p-3 text-left shadow-soft-sm transition hover:-translate-y-0.5 hover:shadow-soft dark:bg-ink-900/60 ${
                      TRIAGE_ROW_STYLES[patient.triage] ??
                      "border-ink-200 dark:border-ink-700"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-soft-sm ${
                        TRIAGE_DOT_STYLES[patient.triage] ?? "bg-ink-500 text-white"
                      }`}
                    >
                      {patient.queuePosition}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
                          {patient.name}
                        </p>
                        <CtasLevelBadge level={patient.triage} className="shrink-0" />
                      </div>
                      <CtasUrgencyMessage
                        level={patient.triage}
                        className="mt-0.5 text-ink-600 dark:text-ink-400"
                      />
                      <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">
                        {patient.symptom}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                        {patient.waitMinutes} min
                      </p>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                        espera
                      </p>
                    </div>
                  </button>
                ))}
                {waitingQueue.length > 8 ? (
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    Mostrando 8 de {waitingQueue.length} pacientes en espera.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <Suspense
            fallback={
              <div className="card text-sm text-ink-500 dark:text-ink-400">
                Cargando gráfica...
              </div>
            }
          >
            <DashboardTriageChart data={data} />
          </Suspense>
        </div>
      </div>
    </DataState>
  );
}
