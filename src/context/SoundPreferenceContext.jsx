import { useMemo, useState } from "react";
import { SoundPreferenceContext } from "./sound-context";

const STORAGE_KEY = "triageia:sound-enabled";

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === null) return true;
    return v === "true";
  } catch {
    return true;
  }
}

export function SoundPreferenceProvider({ children }) {
  const [soundEnabled, setSoundEnabledState] = useState(readStored);

  const setSoundEnabled = (value) => {
    setSoundEnabledState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* ignore */
    }
  };

  const value = useMemo(
    () => ({ soundEnabled, setSoundEnabled }),
    [soundEnabled]
  );

  return (
    <SoundPreferenceContext.Provider value={value}>
      {children}
    </SoundPreferenceContext.Provider>
  );
}
