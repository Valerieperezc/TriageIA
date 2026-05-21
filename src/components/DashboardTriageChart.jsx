import { useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getCtasLevelInfo } from "../constants/ctasProtocol";

const COLORS = ["#dc2626", "#f97316", "#f59e0b", "#65a30d", "#0ea5e9"];
const CHART_HEIGHT = 220;

export function DashboardTriageChart({ data }) {
  const chartWrapRef = useRef(null);
  const [chartReady, setChartReady] = useState(false);
  const totalPatients = data.reduce((acc, item) => acc + item.value, 0);
  const hasData = totalPatients > 0;

  useEffect(() => {
    const el = chartWrapRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setChartReady(width > 0 && height > 0);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="card min-w-0" data-testid="dashboard-triage-chart">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-50">
            Distribución CTAS
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Proporción de pacientes por nivel de triage registrados hoy.
          </p>
        </div>
        <span className="badge badge-slate shrink-0">Hoy</span>
      </div>

      <div className="mt-4 grid min-w-0 items-center gap-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <div
          ref={chartWrapRef}
          className="relative mx-auto w-full min-w-[160px] max-w-[240px]"
          style={{ height: CHART_HEIGHT }}
        >
          {chartReady ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT} minWidth={0}>
              <PieChart>
                <Pie
                  data={hasData ? data : [{ name: "empty", value: 1 }]}
                  dataKey="value"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={hasData ? 2 : 0}
                  stroke="none"
                >
                  {(hasData ? data : [{ name: "empty" }]).map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={hasData ? COLORS[index] : "#e2e8f0"}
                    />
                  ))}
                </Pie>
                {hasData ? <Tooltip /> : null}
              </PieChart>
            </ResponsiveContainer>
          ) : null}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-ink-900 dark:text-ink-50">
              {totalPatients}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
              Pacientes hoy
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {data.map((item, index) => {
            const info = getCtasLevelInfo(item.name);
            const pct =
              totalPatients > 0
                ? Math.round((item.value / totalPatients) * 100)
                : 0;
            return (
              <div
                key={item.name}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm shadow-soft-sm ${
                  info?.cardSurfaceClass ??
                  "border-ink-200/70 bg-white/60 dark:border-ink-700 dark:bg-ink-800/50"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">
                      CTAS {item.name} · {info?.label ?? item.name}
                    </p>
                    <p className="line-clamp-2 text-[11px] font-medium text-ink-600 dark:text-ink-300">
                      {info?.urgencyMessage ?? ""}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                    {item.value}
                  </p>
                  <p className="text-[11px] text-ink-500 dark:text-ink-400">
                    {pct}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
