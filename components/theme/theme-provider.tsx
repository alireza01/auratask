"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAppStore } from "@/lib/store" // Import useAppStore
import type { UserSettings } from "@/types" // Import UserSettings type

type Theme = "light" | "dark" | "neda" | "alireza"
type UserThemeSetting = UserSettings["theme"] // "default" | "neda" | "alireza" | undefined

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "auratask-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme
    }
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })

  const { settings: userSettings, updateSettings } = useAppStore()

  // Effect 1: Synchronize user's preferred theme (from Zustand store) to the context
  useEffect(() => {
    if (userSettings?.theme) {
      let targetContextTheme: Theme = "light" // Default mapping from "default" user theme

      if (userSettings.theme === "neda" || userSettings.theme === "alireza") {
        targetContextTheme = userSettings.theme
      } else if (userSettings.theme === "default") {
        // You could add logic here to check system preference for "default"
        // For now, "default" user theme maps to "light" context theme.
        // If user explicitly saved "dark" via this provider, it would be in localStorage
        // or directly as "dark" if your UserSettings.theme supports "dark".
        // Assuming UserSettings.theme can be "light" or "dark" if we want to store that preference.
        // For this consolidation, "default" from old system maps to "light".
        targetContextTheme = "light"
      }
      // else if (userSettings.theme === "dark" || userSettings.theme === "light") {
      //   // If userSettings.theme can also store "light" or "dark" directly
      //   targetContextTheme = userSettings.theme;
      // }


      if (theme !== targetContextTheme) {
        // This will update localStorage, local state, and apply CSS classes via the second useEffect
        setThemeState(targetContextTheme)
        // No need to call localStorage.setItem here as setThemeState's wrapper (newSetTheme) will do it.
        // Actually, the original setTheme in the value object will handle localStorage.
        // The setThemeState here is the direct useState setter.
      }
    }
  // Only run when userSettings.theme changes, or on initial load if theme state needs sync.
  // `theme` is the local state, `setThemeState` is its setter.
  }, [userSettings?.theme, theme, setThemeState, storageKey])

  // Effect 2: Apply theme classes to HTML root
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark", "theme-neda", "theme-alireza")

    if (theme === "neda") {
      root.classList.add("theme-neda")
    } else if (theme === "alireza") {
      root.classList.add("theme-alireza", "dark")
    } else {
      root.classList.add(theme) // "light" or "dark"
    }
  }, [theme])

  // Enhanced setTheme function to also update Zustand store (and thus backend)
  const newSetTheme = (newContextTheme: Theme) => {
    localStorage.setItem(storageKey, newContextTheme) // Update localStorage
    setThemeState(newContextTheme) // Update local React state, triggers CSS class update

    // Map context theme to UserSettings.theme type for storing in Zustand/backend
    let userThemeToStore: UserThemeSetting = "default"
    if (newContextTheme === "neda" || newContextTheme === "alireza") {
      userThemeToStore = newContextTheme
    } else if (newContextTheme === "dark") {
      // If you want to save "dark" specifically in user settings
      // userThemeToStore = "dark"; // This requires UserSettings["theme"] to support "dark"
      // For now, "dark" and "light" from context map to "default" in UserSettings,
      // letting localStorage handle light/dark for non-Neda/Alireza.
      // Or, if "default" means "light", then explicitly saving "dark" is needed.
      // Let's assume for now: if user picks "dark" in UI, we save "dark" to their settings.
      // This means UserSettings.theme should be extended or "default" has clear light/dark meaning.
      // For this refactor, let's assume "light" and "dark" map to "default" in user settings,
      // and specific "neda", "alireza" are stored as such.
      // This means light/dark choices are local to browser unless UserSettings.theme is expanded.
      //
      // Revisiting: The task implies `user.theme` from Zustand can be "default", "alireza", "neda".
      // `theme-provider` (target) supports "light", "dark", "neda", "alireza".
      // If `setTheme` is called with "light" or "dark", we should map it to "default" for `userSettings.theme`.
      // If `setTheme` is called with "neda" or "alireza", map directly.
       userThemeToStore = "default"; // for "light" or "dark"
    }
     if (newContextTheme === "neda" || newContextTheme === "alireza") {
        userThemeToStore = newContextTheme;
    }
    // else "light" or "dark" will map to "default" for userSettings.theme.

    // Only update if the new mapped theme is different from current user settings theme
    if (userSettings?.theme !== userThemeToStore) {
      updateSettings({ theme: userThemeToStore })
    }
  }

  const value = {
    theme,
    setTheme: newSetTheme, // Use the enhanced setTheme
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
