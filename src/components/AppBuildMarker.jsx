/** Indicador visible para confirmar qué versión está desplegada (soporte / caché). */
const BUILD_LABEL = "2026-05-21-movil";

export function AppBuildMarker() {
  return (
    <p
      className="pointer-events-none fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-2 z-50 rounded-md bg-ink-900/75 px-1.5 py-0.5 text-[9px] font-mono font-medium text-white md:bottom-2 md:right-3"
      data-testid="app-build-marker"
      aria-hidden
    >
      {BUILD_LABEL}
    </p>
  );
}
