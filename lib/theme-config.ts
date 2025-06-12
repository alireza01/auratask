export interface ThemeConfig {
  streakIcon: React.ReactNode | string;
  achievementIcon: React.ReactNode | string;
  celebrationIcon: React.ReactNode | string; // Added for AchievementUnlockNotification
}

export const themes: Record<string, ThemeConfig> = {
  default: {
    streakIcon: "Flame",
    achievementIcon: "Trophy",
    celebrationIcon: "Sparkles",
  },
  alireza: {
    streakIcon: "🍌",
    achievementIcon: "🍌",
    celebrationIcon: "🍌",
  },
  neda: {
    streakIcon: "Flame",
    achievementIcon: "Trophy",
    celebrationIcon: "Sparkles",
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
