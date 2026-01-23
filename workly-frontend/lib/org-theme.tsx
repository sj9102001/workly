"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type OrgThemeColor = 
  | "slate" 
  | "zinc" 
  | "neutral" 
  | "red" 
  | "orange" 
  | "amber" 
  | "yellow"
  | "lime"
  | "green" 
  | "emerald" 
  | "teal" 
  | "cyan" 
  | "sky"
  | "blue" 
  | "indigo" 
  | "violet" 
  | "purple" 
  | "fuchsia"
  | "pink" 
  | "rose";

export interface OrgTheme {
  primaryColor: OrgThemeColor;
  accentColor: OrgThemeColor;
}

const defaultTheme: OrgTheme = {
  primaryColor: "slate",
  accentColor: "blue",
};

// Color values for each theme color
export const themeColors: Record<OrgThemeColor, { primary: string; light: string; dark: string }> = {
  slate: { primary: "#475569", light: "#f1f5f9", dark: "#1e293b" },
  zinc: { primary: "#52525b", light: "#f4f4f5", dark: "#27272a" },
  neutral: { primary: "#525252", light: "#f5f5f5", dark: "#262626" },
  red: { primary: "#dc2626", light: "#fef2f2", dark: "#991b1b" },
  orange: { primary: "#ea580c", light: "#fff7ed", dark: "#9a3412" },
  amber: { primary: "#d97706", light: "#fffbeb", dark: "#92400e" },
  yellow: { primary: "#ca8a04", light: "#fefce8", dark: "#854d0e" },
  lime: { primary: "#65a30d", light: "#f7fee7", dark: "#3f6212" },
  green: { primary: "#16a34a", light: "#f0fdf4", dark: "#166534" },
  emerald: { primary: "#059669", light: "#ecfdf5", dark: "#065f46" },
  teal: { primary: "#0d9488", light: "#f0fdfa", dark: "#115e59" },
  cyan: { primary: "#0891b2", light: "#ecfeff", dark: "#155e75" },
  sky: { primary: "#0284c7", light: "#f0f9ff", dark: "#075985" },
  blue: { primary: "#2563eb", light: "#eff6ff", dark: "#1e40af" },
  indigo: { primary: "#4f46e5", light: "#eef2ff", dark: "#3730a3" },
  violet: { primary: "#7c3aed", light: "#f5f3ff", dark: "#5b21b6" },
  purple: { primary: "#9333ea", light: "#faf5ff", dark: "#6b21a8" },
  fuchsia: { primary: "#c026d3", light: "#fdf4ff", dark: "#86198f" },
  pink: { primary: "#db2777", light: "#fdf2f8", dark: "#9d174d" },
  rose: { primary: "#e11d48", light: "#fff1f2", dark: "#9f1239" },
};

interface OrgThemeContextValue {
  theme: OrgTheme;
  setTheme: (theme: OrgTheme) => void;
  saveTheme: (orgId: number, theme: OrgTheme) => void;
  loadTheme: (orgId: number) => void;
}

const OrgThemeContext = createContext<OrgThemeContextValue | null>(null);

export function OrgThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<OrgTheme>(defaultTheme);

  const setTheme = useCallback((newTheme: OrgTheme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, []);

  const saveTheme = useCallback((orgId: number, newTheme: OrgTheme) => {
    localStorage.setItem(`org-theme-${orgId}`, JSON.stringify(newTheme));
    setTheme(newTheme);
  }, [setTheme]);

  const loadTheme = useCallback((orgId: number) => {
    const saved = localStorage.getItem(`org-theme-${orgId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as OrgTheme;
        setTheme(parsed);
      } catch {
        setTheme(defaultTheme);
      }
    } else {
      setTheme(defaultTheme);
    }
  }, [setTheme]);

  return (
    <OrgThemeContext.Provider value={{ theme, setTheme, saveTheme, loadTheme }}>
      {children}
    </OrgThemeContext.Provider>
  );
}

export function useOrgTheme() {
  const context = useContext(OrgThemeContext);
  if (!context) {
    throw new Error("useOrgTheme must be used within an OrgThemeProvider");
  }
  return context;
}

function applyTheme(theme: OrgTheme) {
  const root = document.documentElement;
  const primaryColors = themeColors[theme.primaryColor];
  const accentColors = themeColors[theme.accentColor];

  // Apply primary color (for sidebar header, avatars, etc.)
  root.style.setProperty("--org-primary", primaryColors.primary);
  root.style.setProperty("--org-primary-light", primaryColors.light);
  root.style.setProperty("--org-primary-dark", primaryColors.dark);

  // Apply accent color (for buttons, links, active states)
  root.style.setProperty("--org-accent", accentColors.primary);
  root.style.setProperty("--org-accent-light", accentColors.light);
  root.style.setProperty("--org-accent-dark", accentColors.dark);
}
