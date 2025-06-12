"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { showLevelUpToast } from "@/lib/toast-notifications"

export function LevelUpToastManager() {
  const justLeveledUpTo = useAppStore((state) => state.justLeveledUpTo)
  const setJustLeveledUpTo = useAppStore((state) => state.setJustLeveledUpTo)
  const userSettingsLevel = useAppStore((state) => state.settings?.level) // Get current level from settings

  useEffect(() => {
    if (justLeveledUpTo !== null) {
      // Ensure the level in the toast matches the current settings level if they are in sync
      // Or, prioritize justLeveledUpTo if it's specifically set by an event.
      const levelToShow = justLeveledUpTo; // Could also use userSettingsLevel if there's a sync concern

      showLevelUpToast(levelToShow)
      setJustLeveledUpTo(null) // Reset after showing toast
    }
  }, [justLeveledUpTo, setJustLeveledUpTo, userSettingsLevel])

  return null // This component does not render anything itself
}
