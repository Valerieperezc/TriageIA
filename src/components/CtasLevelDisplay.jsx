import {
  CTAS_LEVELS,
  getCtasLevelInfo,
} from "../constants/ctasProtocol";

/** Insignia CTAS con color por nivel. */
export function CtasLevelBadge({ level, className = "" }) {
  const info = getCtasLevelInfo(level);
  if (!info) {
    return (
      <span className={`badge badge-slate ${className}`.trim()}>CTAS —</span>
    );
  }
  return (
    <span
      className={`badge ${info.badgeClass} ${className}`.trim()}
      data-testid={`ctas-badge-${level}`}
    >
      CTAS {level}
    </span>
  );
}

/** Etiqueta clínica + mensaje de tiempo de espera / urgencia. */
export function CtasUrgencyMessage({ level, className = "" }) {
  const info = getCtasLevelInfo(level);
  if (!info) return null;
  return (
    <p
      className={`text-xs font-medium leading-snug ${className}`.trim()}
      data-testid={`ctas-urgency-msg-${level}`}
    >
      {info.urgencyMessage}
    </p>
  );
}

/** Resumen: badge, categoría y mensaje operativo. */
export function CtasLevelSummary({ level, testId }) {
  const info = getCtasLevelInfo(level);
  if (!info) return null;
  return (
    <div
      className={`rounded-xl border p-4 ${info.cardSurfaceClass}`}
      data-testid={testId ?? `ctas-summary-${level}`}
    >
      <CtasLevelBadge level={level} />
      <p className="mt-2 text-sm font-semibold text-ink-800 dark:text-ink-100">
        {info.label}
      </p>
      <CtasUrgencyMessage
        level={level}
        className="mt-1 text-ink-700 dark:text-ink-300"
      />
    </div>
  );
}

/** Botones I–V con color por urgencia (asignación / reasignación). */
export function CtasLevelPicker({
  value,
  onChange,
  onUserSelect,
  testIdPrefix = "ctas-pick",
  ariaLabel = "Nivel CTAS",
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {CTAS_LEVELS.map((level) => {
        const info = getCtasLevelInfo(level);
        const active = value === level;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={`${testIdPrefix}-${level}`}
            onClick={() => {
              onUserSelect?.();
              onChange(level);
            }}
            className={`flex min-h-[4.5rem] flex-col items-start rounded-xl border px-3 py-2.5 text-left transition ${
              active
                ? info?.pickerActiveClass
                : info?.pickerIdleClass ??
                  "border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-800/60"
            }`}
          >
            <span className="text-base font-bold">CTAS {level}</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-90">
              {info?.label ?? level}
            </span>
            <span className="mt-1 line-clamp-2 text-[10px] font-medium leading-tight opacity-95">
              {info?.urgencyMessage}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Tarjeta del dashboard: conteo por nivel con color y mensaje. */
export function CtasDashboardCard({ level, count, icon: Icon, onClick }) {
  const info = getCtasLevelInfo(level);
  if (!info) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card card-hover relative flex flex-col gap-3 overflow-hidden border-2 p-4 text-left ${info.cardSurfaceClass}`}
      data-testid={`dashboard-ctas-card-${level}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${info.accentBarClass}`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`rounded-xl p-2 ${info.iconSurfaceClass}`}>
            {Icon ? <Icon className={`h-5 w-5 ${info.iconClass}`} /> : null}
          </div>
          <div>
            <p className="text-sm font-bold text-ink-900 dark:text-ink-50">
              CTAS {level}
            </p>
            <p className="text-[11px] font-medium text-ink-600 dark:text-ink-300">
              {info.label}
            </p>
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums text-ink-900 dark:text-ink-50">
          {count}
        </p>
      </div>
      <p className="text-[11px] font-medium leading-snug text-ink-700 dark:text-ink-300">
        {info.urgencyMessage}
      </p>
    </button>
  );
}
