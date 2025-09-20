"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeName, THEMES } from "./constants";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  clarity: boolean;
  setClarity: (clarity: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeName>("AURORA");
  const [clarity, setClarity] = useState(true);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(
        "gogentic:theme"
      ) as ThemeName | null;
      const savedClarity = localStorage.getItem("gogentic:clarity");

      if (savedTheme && THEMES[savedTheme]) {
        setTheme(savedTheme);
      }

      if (savedClarity !== null) {
        setClarity(savedClarity === "true");
      }
    } catch (error) {
      console.warn("Failed to load theme from localStorage:", error);
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("gogentic:theme", theme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }
  }, [theme]);

  // Save clarity to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("gogentic:clarity", clarity.toString());
    } catch (error) {
      console.warn("Failed to save clarity to localStorage:", error);
    }
  }, [clarity]);

  const value = {
    theme,
    setTheme,
    clarity,
    setClarity,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
