import { Suspense, lazy } from "react";

const LazyToaster = lazy(() =>
  import("react-hot-toast").then((module) => ({ default: module.Toaster }))
);

export function AppToaster() {
  return (
    <Suspense fallback={null}>
      <LazyToaster />
    </Suspense>
  );
}
