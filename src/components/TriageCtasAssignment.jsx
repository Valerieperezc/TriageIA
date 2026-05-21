import { useEffect, useRef } from "react";
import { AlertTriangle, Info } from "lucide-react";
import {
  CTAS_OVERRIDE_REASONS,
  CTAS_SAFETY_DISCLAIMER,
  getChiefComplaintByCode,
  getCtasLevelInfo,
} from "../constants/ctasProtocol";
import { isUndertriage } from "../utils/ctasTriage";
import {
  CtasLevelBadge,
  CtasLevelPicker,
  CtasLevelSummary,
  CtasUrgencyMessage,
} from "./CtasLevelDisplay";

/** Panel de sugerencia CTAS + asignación definitiva. */
export function TriageCtasAssignment({
  suggestion,
  triageAssigned,
  onTriageAssignedChange,
  overrideReasonCode,
  onOverrideReasonChange,
  overrideNote,
  onOverrideNoteChange,
  assignmentError,
}) {
  const userTouchedAssignment = useRef(false);

  useEffect(() => {
    if (!suggestion?.level || userTouchedAssignment.current) return;
    onTriageAssignedChange(suggestion.level);
  }, [suggestion?.level, onTriageAssignedChange]);

  const undertriage =
    suggestion?.level && triageAssigned
      ? isUndertriage(suggestion.level, triageAssigned)
      : false;

  const complaintLabel = suggestion?.chiefComplaintCode
    ? getChiefComplaintByCode(suggestion.chiefComplaintCode)?.label
    : null;

  const assignedInfo = getCtasLevelInfo(triageAssigned);

  if (!suggestion?.level) {
    return (
      <section className="card space-y-2 border-dashed">
        <p className="text-xs text-ink-500 dark:text-ink-400">
          Complete motivo de consulta y signos vitales para obtener la sugerencia
          CTAS del sistema.
        </p>
      </section>
    );
  }

  return (
    <section className="card space-y-4" data-testid="triage-ctas-assignment">
      <SafetyDisclaimer />

      <div data-testid="triage-preview">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          Sugerencia del sistema
        </p>
        <CtasLevelSummary
          level={suggestion.level}
          testId="triage-suggested-level"
        />
        <ul className="mt-2 space-y-0.5 text-[11px] text-ink-500 dark:text-ink-400">
          {complaintLabel ? (
            <li>
              Motivo: {complaintLabel} (base {suggestion.complaintLevel})
            </li>
          ) : null}
          <li>Signos vitales: {suggestion.vitalsLevel}</li>
          <li>Discriminadores: {suggestion.flagsLevel}</li>
        </ul>
      </div>

      <div className="space-y-3">
        <p className="form-label">Nivel CTAS definitivo (asignación clínica)</p>
        <CtasLevelPicker
          value={triageAssigned}
          onChange={onTriageAssignedChange}
          onUserSelect={() => {
            userTouchedAssignment.current = true;
          }}
          testIdPrefix="triage-assign"
          ariaLabel="Nivel CTAS asignado"
        />
        {assignedInfo && triageAssigned ? (
          <div
            className={`rounded-lg border px-3 py-2 ${assignedInfo.cardSurfaceClass}`}
            data-testid="triage-assigned-urgency-hint"
          >
            <p className="text-xs font-semibold text-ink-800 dark:text-ink-100">
              Asignación seleccionada: CTAS {triageAssigned} · {assignedInfo.label}
            </p>
            <CtasUrgencyMessage
              level={triageAssigned}
              className="mt-0.5 text-ink-700 dark:text-ink-300"
            />
          </div>
        ) : null}
      </div>

      {assignmentError ? (
        <p
          className="text-xs font-medium text-red-600 dark:text-red-400"
          role="alert"
        >
          {assignmentError}
        </p>
      ) : null}

      {undertriage ? (
        <UndertriagePanel
          overrideReasonCode={overrideReasonCode}
          onOverrideReasonChange={onOverrideReasonChange}
          overrideNote={overrideNote}
          onOverrideNoteChange={onOverrideNoteChange}
          suggestedLevel={suggestion.level}
        />
      ) : null}
    </section>
  );
}

function SafetyDisclaimer() {
  return (
    <div
      className="flex gap-2 rounded-xl border border-brand-200/80 bg-brand-50/80 px-3 py-2 text-xs text-brand-900 dark:border-brand-800/50 dark:bg-brand-950/40 dark:text-brand-100"
      role="note"
      data-testid="ctas-safety-disclaimer"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{CTAS_SAFETY_DISCLAIMER}</p>
    </div>
  );
}

function UndertriagePanel({
  overrideReasonCode,
  onOverrideReasonChange,
  overrideNote,
  onOverrideNoteChange,
  suggestedLevel,
}) {
  return (
    <div
      className="space-y-3 rounded-xl border border-amber-300/80 bg-amber-50/90 p-4 dark:border-amber-800/60 dark:bg-amber-950/30"
      data-testid="triage-undertriage-panel"
    >
      <div className="flex gap-2 text-sm text-amber-950 dark:text-amber-100">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p>
            <strong>Atención:</strong> el nivel asignado es menos urgente que la
            sugerencia (
            <CtasLevelBadge level={suggestedLevel} className="mx-0.5 align-middle" />
            ). Debe documentar el motivo.
          </p>
          <CtasUrgencyMessage
            level={suggestedLevel}
            className="mt-1 text-amber-900/90 dark:text-amber-100/90"
          />
        </div>
      </div>
      <label className="block space-y-1">
        <span className="form-label">Motivo del cambio</span>
        <select
          data-testid="triage-override-reason"
          className="input w-full"
          value={overrideReasonCode}
          onChange={(e) => onOverrideReasonChange(e.target.value)}
        >
          <option value="">Seleccione…</option>
          {CTAS_OVERRIDE_REASONS.map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="form-label">Nota (obligatoria si elige «Otro»)</span>
        <textarea
          data-testid="triage-override-note"
          className="input min-h-[72px] w-full"
          placeholder="Describa brevemente el criterio clínico…"
          value={overrideNote}
          onChange={(e) => onOverrideNoteChange(e.target.value)}
        />
      </label>
    </div>
  );
}
