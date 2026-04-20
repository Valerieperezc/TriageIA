import { Link } from "react-router-dom";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-xl overflow-hidden">
      <div className="relative -mx-5 -mt-5 flex items-center justify-center overflow-hidden bg-brand-gradient px-5 py-10 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-white/40 blur-3xl" />
          <div className="absolute -bottom-10 right-0 h-48 w-48 rounded-full bg-sky-300/40 blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Compass className="h-6 w-6" />
          </span>
          <p className="mt-4 text-6xl font-extrabold tracking-tight">404</p>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/80">
            Página no encontrada
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4 text-center">
        <p className="text-sm text-ink-600 dark:text-ink-300">
          La página que buscas no existe, fue movida o no tienes permisos para
          verla.
        </p>
        <Link to="/" className="btn btn-primary inline-flex">
          <Home className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
