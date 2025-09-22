"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeName, THEMES } from "./constants";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  clarity: boolean;
  setClarity: (clarity: boolean) => void;
  backgroundMode: "dark" | "light";
  setBackgroundMode: (mode: "dark" | "light") => void;
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
  const [clarity, setClarity] = useState(false); // Default to standard contrast (false = standard, true = high)
  const [backgroundMode, setBackgroundMode] = useState<"dark" | "light">(
    "dark"
  );

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(
        "gogentic:theme"
      ) as ThemeName | null;
      const savedClarity = localStorage.getItem("gogentic:clarity");
      const savedBackgroundMode = localStorage.getItem(
        "gogentic:backgroundMode"
      );

      if (savedTheme && THEMES[savedTheme]) {
        setTheme(savedTheme);
      }

      // Force reset to standard contrast for all users
      // Remove old setting and set to false
      localStorage.removeItem("gogentic:clarity");
      setClarity(false); // Always use standard contrast

      if (savedBackgroundMode === "light" || savedBackgroundMode === "dark") {
        setBackgroundMode(savedBackgroundMode);
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

  // Disabled saving clarity - always using standard contrast
  // useEffect(() => {
  //   try {
  //     localStorage.setItem("gogentic:clarity", clarity.toString());
  //   } catch (error) {
  //     console.warn("Failed to save clarity to localStorage:", error);
  //   }
  // }, [clarity]);

  // Save background mode to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("gogentic:backgroundMode", backgroundMode);
    } catch (error) {
      console.warn("Failed to save background mode to localStorage:", error);
    }
  }, [backgroundMode]);

  const value = {
    theme,
    setTheme,
    clarity,
    setClarity,
    backgroundMode,
    setBackgroundMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
