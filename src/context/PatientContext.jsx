import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSoundPreference } from "../hooks/useSoundPreference";
import {
  createAuditEvent,
  createPatient,
  fetchAuditEvents,
  fetchPatients,
  updatePatientDemographics,
  updatePatientStatus,
} from "../services/triageService";
import { calculateTriage } from "../utils/triage";
import { assertValidTriagePayload } from "../utils/triageFormValidation";
import {
  assertAllowedClientStatus,
  assertValidStatusTransition,
} from "../utils/patientStatus";
import { retryAsync } from "../utils/retry";
import {
  DEFAULT_RETRY_STATS,
  readRetryStats,
  writeRetryStats,
} from "../utils/retryStats";
import {
  canCreatePatientByRole,
  canFinalizePatientByRole,
  canSetInAttentionByRole,
  canUpdatePatientDemographicsByRole,
} from "../utils/permissions";
import { PatientContext } from "./patient-context";
import { CRITICAL_ALARM_URL } from "../constants/alarm";

const LOAD_RETRY_DELAYS_MS = [300, 1000];
const ACTION_RETRY_DELAYS_MS = [250, 800];

function shouldRetryTransientError(error) {
  const statusRaw = error?.status ?? error?.code;
  const status = Number(statusRaw);
  if (Number.isFinite(status)) {
    return status === 429 || status >= 500;
  }

  const msg = String(error?.message ?? error ?? "").toLowerCase();
  return /(network|fetch|timeout|timed out|temporar|connection|econn|503|502|504|429)/.test(
    msg
  );
}

function createRequestId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}

function createUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const random = Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12);
  return `00000000-0000-4000-8000-${random}`;
}

export function PatientProvider({ children }) {
  const { user } = useAuth();
  const { soundEnabled } = useSoundPreference();
  const [patients, setPatients] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryStats, setRetryStats] = useState(readRetryStats);

  const role = user?.role;
  const canCreatePatient = canCreatePatientByRole(role);
  const canSetInAttention = canSetInAttentionByRole(role);
  const canFinalizePatient = canFinalizePatientByRole(role);
  const canUpdateDemographics = canUpdatePatientDemographicsByRole(role);

  const markRetry = useCallback(() => {
    setRetryStats((prev) => ({
      ...prev,
      totalRetries: prev.totalRetries + 1,
      lastRetryAt: Date.now(),
    }));
  }, []);

  const markRecoveredLoad = useCallback(() => {
    setRetryStats((prev) => ({
      ...prev,
      recoveredLoads: prev.recoveredLoads + 1,
    }));
  }, []);

  const markRecoveredAction = useCallback(() => {
    setRetryStats((prev) => ({
      ...prev,
      recoveredActions: prev.recoveredActions + 1,
    }));
  }, []);

  const markFailedLoad = useCallback(() => {
    setRetryStats((prev) => ({
      ...prev,
      failedLoads: prev.failedLoads + 1,
    }));
  }, []);

  const markFailedAction = useCallback(() => {
    setRetryStats((prev) => ({
      ...prev,
      failedActions: prev.failedActions + 1,
    }));
  }, []);

  const resetRetryStats = useCallback(() => {
    setRetryStats(DEFAULT_RETRY_STATS);
  }, []);

  useEffect(() => {
    writeRetryStats(retryStats);
  }, [retryStats]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let hadRetry = false;
    const isAdmin = user?.role === "admin";

    try {
      const [patientsData, eventsData] = await retryAsync(
        () =>
          Promise.all([
            fetchPatients(),
            isAdmin ? fetchAuditEvents() : Promise.resolve([]),
          ]),
        {
          delaysMs: LOAD_RETRY_DELAYS_MS,
          shouldRetry: shouldRetryTransientError,
          onRetry: () => {
            hadRetry = true;
            markRetry();
          },
        }
      );
      setPatients(patientsData);
      setHistory(eventsData);
      if (hadRetry) {
        markRecoveredLoad();
      }
    } catch (err) {
      if (hadRetry) {
        markFailedLoad();
      }
      setError(err.message || "No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, [markFailedLoad, markRecoveredLoad, markRetry, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addPatient = async (raw) => {
    if (!canCreatePatient) {
      throw new Error("No tienes permisos para registrar pacientes.");
    }

    const values = assertValidTriagePayload(raw);
    const triage = calculateTriage(values.temp, values.fc, {
      spo2: values.spo2,
      pain: values.pain,
      alteredConsciousness: values.alteredConsciousness,
      respiratoryDistress: values.respiratoryDistress,
    });
    const payload = {
      id: createUuid(),
      ...values,
      triage,
      status: "En espera",
    };

    const actorEmail = user?.email ?? null;
    const createAuditRequestId = createRequestId(`audit:create:${payload.id}`);
    let hadRetry = false;

    try {
      const createdPatient = await retryAsync(() => createPatient(payload), {
        delaysMs: ACTION_RETRY_DELAYS_MS,
        shouldRetry: shouldRetryTransientError,
        onRetry: () => {
          hadRetry = true;
          markRetry();
        },
      });
      await retryAsync(
        () =>
          createAuditEvent({
            patient_id: createdPatient.id,
            patient_name: createdPatient.name,
            action: "Paciente creado",
            triage: createdPatient.triage,
            actor_email: actorEmail ?? undefined,
            request_id: createAuditRequestId,
          }),
        {
          delaysMs: ACTION_RETRY_DELAYS_MS,
          shouldRetry: shouldRetryTransientError,
          onRetry: () => {
            hadRetry = true;
            markRetry();
          },
        }
      );

      setPatients((prev) => [createdPatient, ...prev]);
      setHistory((prev) => [
        {
          name: createdPatient.name,
          action: "Paciente creado",
          triage: createdPatient.triage,
          actor: actorEmail,
          date: new Date().toLocaleString(),
        },
        ...prev,
      ]);

      // Alerta sonora para casos criticos.
      if (triage === "I" && soundEnabled) {
        const audio = new Audio(CRITICAL_ALARM_URL);
        audio.play().catch(() => null);
      }
      if (hadRetry) {
        markRecoveredAction();
      }
    } catch (err) {
      if (hadRetry) {
        markFailedAction();
      }
      setError(err.message || "No se pudo registrar el paciente.");
      throw err;
    }
  };

  const updateStatus = async (id, status) => {
    assertAllowedClientStatus(status);

    if (status === "En atención" && !canSetInAttention) {
      throw new Error("No tienes permisos para pasar a En atención.");
    }

    if (status === "Finalizado" && !canFinalizePatient) {
      throw new Error("No tienes permisos para finalizar pacientes.");
    }

    const patient = patients.find((p) => p.id === id);
    if (!patient) {
      throw new Error("Paciente no encontrado.");
    }
    if (patient.status === status) {
      return;
    }
    assertValidStatusTransition(patient.status, status);

    const actorEmail = user?.email ?? null;
    const statusAuditRequestId = createRequestId(`audit:status:${id}:${status}`);
    let hadRetry = false;

    try {
      await retryAsync(() => updatePatientStatus(id, status), {
        delaysMs: ACTION_RETRY_DELAYS_MS,
        shouldRetry: shouldRetryTransientError,
        onRetry: () => {
          hadRetry = true;
          markRetry();
        },
      });
      await retryAsync(
        () =>
          createAuditEvent({
            patient_id: id,
            patient_name: patient.name || "Paciente",
            action: `Estado: ${status}`,
            triage: patient.triage,
            actor_email: actorEmail ?? undefined,
            request_id: statusAuditRequestId,
          }),
        {
          delaysMs: ACTION_RETRY_DELAYS_MS,
          shouldRetry: shouldRetryTransientError,
          onRetry: () => {
            hadRetry = true;
            markRetry();
          },
        }
      );

      setPatients((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const next = { ...p, status };
          if (status === "En atención" && p.firstAttentionAt == null) {
            next.firstAttentionAt = Date.now();
          }
          return next;
        })
      );
      setHistory((prev) => [
        {
          action: `Estado: ${status}`,
          name: patient.name,
          triage: patient.triage,
          actor: actorEmail,
          date: new Date().toLocaleString(),
        },
        ...prev,
      ]);
      if (hadRetry) {
        markRecoveredAction();
      }
    } catch (err) {
      if (hadRetry) {
        markFailedAction();
      }
      setError(err.message || "No se pudo actualizar el estado.");
      throw err;
    }
  };

  const patchPatientDemographics = async (id, patch) => {
    if (!canUpdateDemographics) {
      throw new Error("No tienes permisos para actualizar datos del paciente.");
    }
    const patient = patients.find((p) => p.id === id);
    if (!patient) {
      throw new Error("Paciente no encontrado.");
    }
    const actorEmail = user?.email ?? null;
    const demoAuditRequestId = createRequestId(`audit:demo:${id}`);
    let hadRetry = false;
    try {
      await retryAsync(() => updatePatientDemographics(id, patch), {
        delaysMs: ACTION_RETRY_DELAYS_MS,
        shouldRetry: shouldRetryTransientError,
        onRetry: () => {
          hadRetry = true;
          markRetry();
        },
      });
      await retryAsync(
        () =>
          createAuditEvent({
            patient_id: id,
            patient_name: patch.name ?? patient.name ?? "Paciente",
            action: "Datos del paciente completados o actualizados",
            triage: patient.triage,
            actor_email: actorEmail ?? undefined,
            request_id: demoAuditRequestId,
          }),
        {
          delaysMs: ACTION_RETRY_DELAYS_MS,
          shouldRetry: shouldRetryTransientError,
          onRetry: () => {
            hadRetry = true;
            markRetry();
          },
        }
      );
      setPatients((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
      setHistory((prev) => [
        {
          action: "Datos del paciente completados o actualizados",
          name: patch.name ?? patient.name,
          triage: patient.triage,
          actor: actorEmail,
          date: new Date().toLocaleString(),
        },
        ...prev,
      ]);
      if (hadRetry) {
        markRecoveredAction();
      }
    } catch (err) {
      if (hadRetry) {
        markFailedAction();
      }
      setError(err.message || "No se pudieron guardar los datos.");
      throw err;
    }
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        addPatient,
        updateStatus,
        patchPatientDemographics,
        history,
        loading,
        error,
        retryStats,
        resetRetryStats,
        reload: loadData,
        canCreatePatient,
        canSetInAttention,
        canFinalizePatient,
        canUpdateDemographics,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}