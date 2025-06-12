"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { showAchievementUnlockedToast } from "@/lib/toast-notifications.tsx"
import type { Achievement } from "@/lib/toast-notifications.tsx" // Ensure type is available

export function AchievementToastManager() {
  const newlyUnlockedAchievement = useAppStore((state) => state.newlyUnlockedAchievement)
  const setNewlyUnlockedAchievement = useAppStore((state) => state.setNewlyUnlockedAchievement)

  useEffect(() => {
    if (newlyUnlockedAchievement) {
      // Ensure we have a valid achievement object.
      // The toast function expects an object that conforms to the Achievement type.
      const achievementData: Achievement = {
        id: newlyUnlockedAchievement.id || BigInt(0), // Ensure id is BigInt or handle conversion
        name: newlyUnlockedAchievement.name || "Unknown Achievement",
        description: newlyUnlockedAchievement.description || "No description available.",
        icon_name: newlyUnlockedAchievement.icon_name || "default",
        reward_points: newlyUnlockedAchievement.reward_points || 0,
        category: newlyUnlockedAchievement.category || "general",
        rarity: newlyUnlockedAchievement.rarity || "common",
        created_at: newlyUnlockedAchievement.created_at || new Date().toISOString(),
        // Optional fields from the Achievement type in toast-notifications
        required_tasks_completed: newlyUnlockedAchievement.required_tasks_completed,
        required_streak_days: newlyUnlockedAchievement.required_streak_days,
        required_level: newlyUnlockedAchievement.required_level,
        unlock_condition_type: newlyUnlockedAchievement.unlock_condition_type,
      };

      showAchievementUnlockedToast(achievementData)
      setNewlyUnlockedAchievement(null) // Reset after showing toast
    }
  }, [newlyUnlockedAchievement, setNewlyUnlockedAchievement])

  return null // This component does not render anything itself
}
