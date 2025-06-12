"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAppStore } from "@/lib/store" // Keep this for later integration

// Define Theme types based on the more comprehensive list, plus "default"
type Theme = "light" | "dark" | "neda" | "alireza" | "default"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialThemeState: ThemeProviderState = {
  theme: "default", // Default to "default" which can map to light or system
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialThemeState)

export function ThemeProvider({
  children,
  defaultTheme = "default", // Changed default to "default"
  storageKey = "auratask-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme
    }
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })

  // Get user theme from store
  const storeUserTheme = useAppStore((state) => state.settings?.theme) // Assuming theme is in settings

  // Effect to update theme from store if user logs in or settings change
  useEffect(() => {
    if (storeUserTheme && storeUserTheme !== theme) {
      // Map store theme names if necessary, e.g. "default" from store might map to "light"
      // For now, assuming storeUserTheme is one of Theme types.
      // This part needs careful mapping if store values are different (e.g. "system" vs "default")
      let newTheme: Theme = storeUserTheme as Theme;
      // Example mapping: if storeUserTheme is 'system', map to 'default' or actual system preference
      // if (storeUserTheme === 'system') newTheme = 'default';

      // Ensure the theme from store is a valid Theme type
      const validThemes: Theme[] = ["light", "dark", "neda", "alireza", "default"];
      if (validThemes.includes(newTheme)) {
        setTheme(newTheme)
      } else {
        // Fallback if store theme is not directly usable
        setTheme(defaultTheme);
      }
    }
  }, [storeUserTheme, theme, defaultTheme])


  // Effect to apply theme to DOM and localStorage
  useEffect(() => {
    const root = window.document.documentElement

    // Remove all potential theme classes
    root.classList.remove("light", "dark", "theme-neda", "theme-alireza", "theme-default") // Added theme-default

    // Apply the current theme
    if (theme === "neda") {
      root.classList.add("theme-neda")
    } else if (theme === "alireza") {
      root.classList.add("theme-alireza", "dark") // Alireza theme is also dark
    } else if (theme === "default") {
      root.classList.add("theme-default") // Or apply 'light' or system-based class
    } else {
      // For "light" or "dark"
      root.classList.add(theme)
    }
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      // Update store if user changes theme via UI (requires new store action)
      // For now, just updates local and localStorage
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
