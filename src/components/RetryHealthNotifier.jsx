import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { usePatients } from "../hooks/usePatients";
import { classifyRetryHealth } from "../utils/retryStats";

/** Aviso toast cuando la resiliencia pasa a estado crítico (sin barra superior). */
export function RetryHealthNotifier() {
  const { retryStats } = usePatients();
  const retryHealth = classifyRetryHealth(retryStats);
  const prevRetryHealthLevelRef = useRef(retryHealth.level);

  useEffect(() => {
    const prev = prevRetryHealthLevelRef.current;
    if (retryHealth.level === "critical" && prev !== "critical") {
      toast.error("Resiliencia crítica: revisa conectividad o backend", {
        id: "retry-health-critical",
      });
    }
    prevRetryHealthLevelRef.current = retryHealth.level;
  }, [retryHealth.level]);

  return null;
}
