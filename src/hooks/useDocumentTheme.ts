import { useEffect, useState } from "react";

import type { ThemeMode } from "../core/state/types";

function useSystemPrefersDark() {
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    setSystemPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return systemPrefersDark;
}

export function useDocumentTheme(themeMode: ThemeMode) {
  const systemPrefersDark = useSystemPrefersDark();

  useEffect(() => {
    const root = document.documentElement;
    const isDark = themeMode === "system" ? systemPrefersDark : themeMode === "dark";

    root.dataset.theme = isDark ? "dark" : "light";
    root.style.colorScheme = isDark ? "dark" : "light";
  }, [systemPrefersDark, themeMode]);
}
