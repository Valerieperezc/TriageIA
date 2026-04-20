import { useMemo, useState, useLayoutEffect, useCallback } from "react";
import { ThemePreferenceContext } from "./theme-context";

const STORAGE_KEY = "triageia:theme";

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
    return "light";
  } catch {
    return "light";
  }
}

function applyDom(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemePreferenceProvider({ children }) {
  const [theme, setThemeState] = useState(readStored);

  useLayoutEffect(() => {
    applyDom(theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState((prev) => {
      const t = typeof next === "function" ? next(prev) : next;
      try {
        localStorage.setItem(STORAGE_KEY, t);
      } catch {
        /* ignore */
      }
      return t;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, [setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}
