"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useAppStore } from "@/lib/store"
import type { User, UserSettings } from "@/types" // Import types
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link";
import { Settings, Sparkles, Flame, PlusCircle, Sun, Moon, Trophy, Shield, LogOut } from "lucide-react"; // Add Trophy, Shield, LogOut
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"; // Add DropdownMenu components and Label
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast" // For Aura reward notifications
import { supabase } from "@/lib/supabase-client"; // Ensure this is correctly imported
import { getThemeConfig } from "@/lib/theme-config"; // Added import

export function Header() {
  const t = useTranslations()
  const {
    user,
    settings,
    toggleSettingsPanel,
    openTaskForm,
    darkMode, // Get darkMode state from the store
    setDarkMode, // Get setDarkMode action from the store
  } = useAppStore()
  const { toast } = useToast()

  const appTheme = settings?.theme || "system" // 'neda', 'alireza', or 'system'
  const currentThemeName = (appTheme === "system" || !appTheme) ? "default" : appTheme;
  const themeConfig = getThemeConfig(currentThemeName);
  // const streakIcon = themeConfig.streakIcon; // Ready to be used where streak is displayed

  const handleThemeToggle = () => {
    setDarkMode(!darkMode); // This action in store should also update localStorage via persist and next-themes
  }

  const userDisplayName = settings?.username || user?.email || "Guest"
  const userAvatarUrl = user?.avatar_url || '/placeholder-user.jpg' // Placeholder if no avatar

  const isAdmin = settings?.username === 'admin';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // router.push('/') // The issue description notes this might not be needed if Supabase listener handles it. Let's stick to the provided code.
  };

  return (
    <header
      className={cn(
        "border-b backdrop-blur-sm sticky top-0 z-50 transition-all duration-300",
        appTheme === "neda" && "bg-card/50 border-pink-200/50",
        appTheme === "alireza" && "bg-gray-900/80 border-yellow-400/30 yellow-glow",
        // Default theming (light/dark) is handled by classes on <html> via next-themes
        // and store's darkMode state. No specific bg-card/50 needed here for system themes.
      )}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              appTheme === "neda" && "bg-gradient-to-br from-purple-500 to-pink-500",
              appTheme === "alireza" && "bg-gradient-to-br from-yellow-400 to-yellow-600",
              (appTheme === "system" || !appTheme) && "bg-gradient-to-br from-purple-500 to-pink-500", // Default gradient
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className={cn("text-xl font-bold font-satoshi", appTheme === "alireza" && "text-yellow-400")}>
              {t("app.title")} {/* Assumes "app.title" is a valid translation key */}
            </h1>
            {/* Subtitle can be removed or kept if desired */}
            {/* <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p> */}
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-2 sm:gap-3" // Adjusted gap for smaller screens
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Button variant="ghost" size="sm" onClick={() => openTaskForm()} className="hidden sm:flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4" /> New Task
          </Button>

          <Button variant="ghost" size="icon" onClick={handleThemeToggle} aria-label="Toggle theme">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                  <AvatarFallback>{userDisplayName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{userDisplayName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/leaderboard">
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>Leaderboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSettingsPanel(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>
      {/* SettingsPanel is no longer rendered here directly. Its visibility is controlled by isSettingsPanelOpen in the store,
          and it's rendered in TaskDashboard.tsx */}
    </header>
  )
}
