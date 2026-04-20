import { useContext } from "react";
import { ThemePreferenceContext } from "../context/theme-context";

export function useTheme() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemePreferenceProvider");
  }
  return ctx;
}
