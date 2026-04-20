import { Suspense, lazy } from "react";

const App = lazy(() => import("../App"));

export function AppShell() {
  return (
    <Suspense fallback={<div className="p-6 dark:text-slate-100">Cargando aplicación...</div>}>
      <App />
    </Suspense>
  );
}
