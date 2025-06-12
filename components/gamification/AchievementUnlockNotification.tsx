"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { getThemeConfig } from "@/lib/theme-config";

interface Achievement {
  id: string
  name: string
  description: string
  icon_name: string
  reward_points: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface AchievementUnlockNotificationProps {
  achievement: Achievement
  onClose: () => void
}

const rarityColors = {
  common: "from-gray-400 to-gray-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-yellow-400 to-orange-500",
}

export function AchievementUnlockNotification({ achievement, onClose }: AchievementUnlockNotificationProps) {
  const { theme: currentTheme } = useTheme()
  const themeName = (currentTheme === "system" || !currentTheme) ? "default" : currentTheme;
  const themeConfig = getThemeConfig(themeName);

  useEffect(() => {
    // Trigger haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          exit: { duration: 0.3 },
        }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <Card
          className={cn(
            "p-4 shadow-xl border-2 backdrop-blur-md",
            themeName === "alireza"
              ? "border-yellow-400 bg-gray-900/90 yellow-glow"
              : "border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20",
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: 2,
                }}
                className={cn(
                  "p-2 rounded-lg text-white flex items-center justify-center",
                  `bg-gradient-to-br ${rarityColors[achievement.rarity]}`,
                  themeName === "alireza" && "bg-yellow-400/20 border border-yellow-400/50",
                )}
              >
                {themeConfig.achievementIcon}
              </motion.div>
              <div>
                <h3 className={cn("font-semibold text-sm", themeName === "alireza" && "text-yellow-400")}>دستاورد جدید!</h3>
                <Badge
                  className={cn(
                    "text-xs",
                    `bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white`,
                    themeName === "alireza" && "bg-yellow-400/20 text-yellow-400 border-yellow-400/30",
                  )}
                >
                  {achievement.rarity}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={cn("h-6 w-6 p-0", themeName === "alireza" && "hover:bg-yellow-400/20 hover:text-yellow-400")}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className={cn("font-medium", themeName === "alireza" && "text-yellow-400")}>{achievement.description}</h4>
              <p className="text-sm text-muted-foreground">{achievement.name}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Trophy className={cn("w-4 h-4", themeName === "alireza" ? "text-yellow-400" : "text-yellow-500")} />
                <span className={cn("text-sm font-medium", themeName === "alireza" && "text-yellow-400")}>
                  +{achievement.reward_points} امتیاز
                </span>
              </div>

              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                }}
                className="text-xl"
              >
                {themeConfig.celebrationIcon}
              </motion.div>
            </div>
          </div>

          {/* Celebration particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn("absolute w-2 h-2 rounded-full", themeName === "alireza" ? "bg-yellow-400" : "bg-yellow-500")}
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
