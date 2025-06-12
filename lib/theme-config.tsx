import type React from 'react';
import { Flame, Trophy, Sparkles } from 'lucide-react';

export interface ThemeConfig {
  streakIcon: React.ReactNode | string;
  achievementIcon: React.ReactNode | string;
  celebrationIcon: React.ReactNode | string; // Added for AchievementUnlockNotification
}

export const themes: Record<string, ThemeConfig> = {
  default: {
    streakIcon: <Flame className="w-4 h-4" />,
    achievementIcon: <Trophy className="w-6 h-6 text-yellow-500" />, // Example class, adjust as needed
    celebrationIcon: <Sparkles className="w-4 h-4 text-yellow-400" />, // Default celebration icon
  },
  alireza: {
    streakIcon: "🍌",
    achievementIcon: "🍌",
    celebrationIcon: "🍌",
  },
  neda: {
    streakIcon: <Flame className="w-4 h-4 text-pink-500" />, // Example class, adjust as needed
    achievementIcon: <Trophy className="w-6 h-6 text-pink-500" />, // Example class, adjust as needed
    celebrationIcon: <Sparkles className="w-4 h-4 text-pink-400" />, // Neda's celebration icon
  },
  // Add other themes here if necessary
};

export function getThemeConfig(themeName?: string): ThemeConfig {
  if (themeName === "system") {
    // For now, let's assume "system" theme uses "default" icons.
    // This could be made more sophisticated if "system" should adapt to light/dark specifically here.
    return themes.default;
  }
  return themes[themeName || "default"] || themes.default;
}
