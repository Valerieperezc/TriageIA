import { Suspense, lazy, useEffect, useState } from "react";
import { AppLoadingScreen } from "./AppLoadingScreen";

const App = lazy(() => import("../App"));

/** Tiempo mínimo para que la animación de arranque sea perceptible. */
const BOOT_MIN_MS = 800;

export function AppShell() {
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setBootReady(true), BOOT_MIN_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!bootReady) {
    return <AppLoadingScreen message="Iniciando TriageIA…" />;
  }

  return (
    <Suspense fallback={<AppLoadingScreen message="Iniciando TriageIA…" />}>
      <App />
    </Suspense>
  );
}
