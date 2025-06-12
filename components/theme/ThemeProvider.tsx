"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"

type Theme = "default" | "alireza" | "neda"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore()
  const [theme, setTheme] = useState<Theme>("default")

  useEffect(() => {
    if (user?.theme) {
      setTheme(user.theme)
    }
  }, [user])

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
