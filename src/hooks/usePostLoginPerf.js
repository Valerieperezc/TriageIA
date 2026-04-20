import { useCallback, useEffect, useState } from "react";
import { downloadTextFile } from "../utils/csv";
import {
  clearPostLoginPerfHistory,
  consumePostLoginNavigationMs,
  formatPostLoginPerfCsv,
  getPostLoginPerfExportFilename,
  POST_LOGIN_PERF_HISTORY_STORAGE_KEY,
  readPostLoginPerfHistory,
  readPostLoginPerfSummary,
  recordPostLoginNavigationMs,
} from "../utils/performance";

/**
 * @param {{ recordSessionNavigationSample?: boolean; syncSummaryOnStorageEvents?: boolean }} [options]
 * - `recordSessionNavigationSample`: solo en la ruta que sigue al login (p. ej. Dashboard):
 *   consume la marca en sessionStorage y añade una muestra al historial en localStorage.
 * - `syncSummaryOnStorageEvents`: si otra pestaña modifica el historial, actualiza el resumen (evento `storage`).
 */
export function usePostLoginPerf(options = {}) {
  const { recordSessionNavigationSample = false, syncSummaryOnStorageEvents = false } = options;
  const [summary, setSummary] = useState(() => readPostLoginPerfSummary());

  useEffect(() => {
    if (!recordSessionNavigationSample) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      const ms = consumePostLoginNavigationMs();
      if (ms != null) {
        recordPostLoginNavigationMs(ms);
        setSummary(readPostLoginPerfSummary());
      }
    }, 0);
    return () => clearTimeout(id);
  }, [recordSessionNavigationSample]);

  useEffect(() => {
    if (!syncSummaryOnStorageEvents || typeof window === "undefined") {
      return undefined;
    }
    const onStorage = (e) => {
      if (e.key !== POST_LOGIN_PERF_HISTORY_STORAGE_KEY || e.storageArea !== localStorage) {
        return;
      }
      setSummary(readPostLoginPerfSummary());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [syncSummaryOnStorageEvents]);

  const refreshSummary = useCallback(() => {
    setSummary(readPostLoginPerfSummary());
  }, []);

  const resetHistory = useCallback(() => {
    clearPostLoginPerfHistory();
    setSummary(readPostLoginPerfSummary());
  }, []);

  /** @returns {boolean} `true` si hubo descarga, `false` si no hay muestras */
  const downloadPostLoginPerfFile = useCallback(() => {
    const csv = formatPostLoginPerfCsv(readPostLoginPerfHistory());
    if (!csv) {
      return false;
    }
    downloadTextFile(getPostLoginPerfExportFilename(), csv);
    return true;
  }, []);

  return {
    summary,
    refreshSummary,
    resetHistory,
    downloadPostLoginPerfFile,
  };
}
