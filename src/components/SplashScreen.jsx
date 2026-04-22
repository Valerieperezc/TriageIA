import { HeartPulse } from "lucide-react";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400">
      <div className="rounded-3xl bg-white/15 px-10 py-8 text-center text-white shadow-2xl backdrop-blur">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
          <HeartPulse className="h-9 w-9" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">TriageIA</h1>
        <p className="mt-2 text-sm text-blue-50">
          Atención ágil para entornos clínicos
        </p>
      </div>
    </div>
  );
}
