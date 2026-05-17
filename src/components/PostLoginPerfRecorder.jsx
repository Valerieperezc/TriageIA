import { usePostLoginPerf } from "../hooks/usePostLoginPerf";

/** Registra en segundo plano la duración de la transición tras el login. */
export function PostLoginPerfRecorder() {
  usePostLoginPerf({ recordSessionNavigationSample: true });
  return null;
}
