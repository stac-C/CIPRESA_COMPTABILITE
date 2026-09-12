import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "cipresa-theme";

function getInitialThemePreference() {
  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  return ["light", "dark", "system"].includes(savedTheme) ? savedTheme : "system";
}

function resolveTheme(preference) {
  if (preference !== "system") return preference;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreference] = useState(getInitialThemePreference);
  const [theme, setTheme] = useState(() => resolveTheme(getInitialThemePreference()));

  useEffect(() => {
    function applyTheme() {
      setTheme(resolveTheme(themePreference));
    }
    applyTheme();
    window.localStorage.setItem(STORAGE_KEY, themePreference);
    if (themePreference !== "system" || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener?.("change", applyTheme);
    return () => mediaQuery.removeEventListener?.("change", applyTheme);
  }, [themePreference]);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  function setThemePreferenceAndPersist(preference) { setThemePreference(preference); }

  function toggleTheme() { setThemePreference(theme === "dark" ? "light" : "dark"); }

  return <ThemeContext.Provider value={{ theme, themePreference, setTheme: setThemePreferenceAndPersist, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme doit être utilisé à l'intérieur de <ThemeProvider>");
  return context;
}
