"use client";

import { useEffect } from "react";
import { useGlobalThemeStore } from "@/store/globalThemeStore";

export function ThemeSync() {
  const theme = useGlobalThemeStore((s) => s.theme);

  useEffect(() => {
    // Remove all possible theme classes
    document.body.classList.remove("theme-cherry", "theme-forest", "theme-ocean", "theme-sunset");
    // Add the current theme class
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return null;
}
