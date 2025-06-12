"use client"

import { useTranslations } from "next-intl"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SettingsPanel } from "@/components/settings/SettingsPanel"
import { Settings, Sparkles, Flame } from "lucide-react"
import { useState } from "react"
import { useTheme } from "@/components/theme/theme-provider"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function Header() {
  const t = useTranslations()
  const { user, userSettings } = useAppStore()
  const { theme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)

  // Mozi Banana signature for Alireza theme
  const getStreakIcon = () => {
    if (theme === "alireza") {
      return "🍌" // Mozi Banana signature
    }
    return <Flame className="w-4 h-4" />
  }

  return (
    <header
      className={cn(
        "border-b backdrop-blur-sm sticky top-0 z-50 transition-all duration-300",
        theme === "neda" && "bg-card/50 border-pink-200/50",
        theme === "alireza" && "bg-gray-900/80 border-yellow-400/30 yellow-glow",
        (theme === "light" || theme === "dark") && "bg-card/50",
      )}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              theme === "neda" && "bg-gradient-to-br from-purple-500 to-pink-500",
              theme === "alireza" && "bg-gradient-to-br from-yellow-400 to-yellow-600",
              (theme === "light" || theme === "dark") && "bg-gradient-to-br from-purple-500 to-pink-500",
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className={cn("text-xl font-bold font-satoshi", theme === "alireza" && "text-yellow-400")}>
              {t("app.title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* User info */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className={cn("text-sm font-medium", theme === "alireza" && "text-yellow-400")}>
                {user?.full_name || user?.email}
              </p>
              <div className="flex items-center gap-2">
                {userSettings?.current_streak && userSettings.current_streak > 0 && (
                  <Badge
                    className={cn(
                      "text-xs",
                      theme === "alireza" && "bg-yellow-400/20 text-yellow-400 border-yellow-400/30",
                    )}
                  >
                    {getStreakIcon()} {userSettings.current_streak} روز
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  سطح {userSettings?.level || 1}
                </Badge>
              </div>
            </div>
          </div>

          {/* Settings button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className={cn(
                "transition-all duration-200",
                theme === "alireza" && "hover:bg-yellow-400/20 hover:text-yellow-400",
              )}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <SettingsPanel open={showSettings} onOpenChange={setShowSettings} />
    </header>
  )
}
