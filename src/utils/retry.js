function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Ejecuta una tarea asincrona con reintentos opcionales.
 * - `delaysMs`: backoff por intento fallido (ej. [300, 1000]).
 * - `shouldRetry`: permite filtrar errores no transitorios.
 * - `onRetry`: callback cuando se programa un nuevo intento.
 */
export async function retryAsync(task, options = {}) {
  const retries = Number.isFinite(options.retries) ? options.retries : 0;
  const delaysMs = Array.isArray(options.delaysMs) ? options.delaysMs : [];
  const shouldRetry =
    typeof options.shouldRetry === "function" ? options.shouldRetry : () => true;
  const onRetry =
    typeof options.onRetry === "function" ? options.onRetry : null;

  const totalAttempts = Math.max(1, retries + 1, delaysMs.length + 1);

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      const isLastAttempt = attempt === totalAttempts;
      if (isLastAttempt || !shouldRetry(error, attempt, totalAttempts)) {
        throw error;
      }

      if (onRetry) {
        onRetry(error, attempt, totalAttempts);
      }

      const delayMs = delaysMs[attempt - 1] ?? 0;
      if (delayMs > 0) {
        await wait(delayMs);
      }
    }
  }

  throw new Error("retryAsync reached an unexpected state.");
}
