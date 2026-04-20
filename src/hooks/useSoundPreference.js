import { useContext } from "react";
import { SoundPreferenceContext } from "../context/sound-context";

export function useSoundPreference() {
  const ctx = useContext(SoundPreferenceContext);
  if (!ctx) {
    throw new Error("useSoundPreference must be used within SoundPreferenceProvider");
  }
  return ctx;
}
