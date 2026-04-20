/** Estados posibles de un paciente dentro del flujo clínico. */
export const PATIENT_STATUS = Object.freeze({
  WAITING: "En espera",
  IN_ATTENTION: "En atención",
  FINALIZED: "Finalizado",
});

/** Estados que el cliente puede aplicar al actualizar un paciente (transiciones desde la UI). */
export const ALLOWED_CLIENT_STATUS_UPDATES = new Set([
  PATIENT_STATUS.IN_ATTENTION,
  PATIENT_STATUS.FINALIZED,
]);

/**
 * Transiciones permitidas desde cada estado.
 * - "En espera" puede pasar a atención o finalizar (p. ej. abandono).
 * - "En atención" solo puede finalizar.
 * - "Finalizado" es un estado terminal: no se puede reabrir ni reatender.
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  [PATIENT_STATUS.WAITING]: new Set([
    PATIENT_STATUS.IN_ATTENTION,
    PATIENT_STATUS.FINALIZED,
  ]),
  [PATIENT_STATUS.IN_ATTENTION]: new Set([PATIENT_STATUS.FINALIZED]),
  [PATIENT_STATUS.FINALIZED]: new Set(),
});

export function assertAllowedClientStatus(status) {
  if (!ALLOWED_CLIENT_STATUS_UPDATES.has(status)) {
    throw new Error("Estado no permitido.");
  }
}

/** Indica si un paciente con `currentStatus` puede pasar a `nextStatus`. */
export function canTransitionStatus(currentStatus, nextStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.has(nextStatus);
}

/** Lanza error si la transición no es válida. */
export function assertValidStatusTransition(currentStatus, nextStatus) {
  if (!canTransitionStatus(currentStatus, nextStatus)) {
    if (currentStatus === PATIENT_STATUS.FINALIZED) {
      throw new Error(
        "El paciente ya fue finalizado. Para atenderlo de nuevo debe registrarse como un nuevo ingreso."
      );
    }
    throw new Error(
      `Transición de estado no permitida: "${currentStatus}" → "${nextStatus}".`
    );
  }
}

/** `true` si el paciente ya está en un estado terminal. */
export function isTerminalStatus(status) {
  return status === PATIENT_STATUS.FINALIZED;
}
