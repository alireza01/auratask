"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useAppStore } from "@/lib/store"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase-client"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Palette, Brain, User, Trophy, Settings } from "lucide-react" // Added Trophy and Settings
import { AchievementsPanel } from "@/components/gamification/AchievementsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const { user, setUser, settings, setHapticFeedbackEnabled, updateSettings } = useAppStore() // Updated
  const hapticFeedbackEnabled = settings?.haptic_feedback_enabled ?? true; // Get from settings, default true
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      onOpenChange(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleThemeChange = (newTheme: "default" | "alireza" | "neda") => {
    setTheme(newTheme)
    updateSettings({ theme: newTheme })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col"> {/* Added flex flex-col for Tabs to grow */}
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> {/* Existing icon */}
            {t("settings.settings")}
          </SheetTitle>
          <SheetDescription>تنظیمات حساب کاربری و شخی‌سازی برنامه</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="settings" className="flex-1 flex flex-col min-h-0 py-6"> {/* Modified to take space and enable scrolling on content */}
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="space-y-6 py-6 flex-1 overflow-y-auto"> {/* Added flex-1 and overflow for scrolling */}
            {/* All existing settings sections (Theme, AI, API Key, Account) go here unchanged */}
            {/* Example for Theme section (ensure all others follow): */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <Label className="text-base font-medium">{t("settings.theme")}</Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "default", name: "پیش‌فرض", color: "bg-gray-500" },
                { key: "alireza", name: "علیرضا", color: "bg-black" },
                { key: "neda", name: "ندا", color: "bg-gradient-to-r from-pink-400 to-purple-400" },
              ].map((themeOption) => (
                <Button
                  key={themeOption.key}
                  variant={theme === themeOption.key ? "default" : "outline"}
                  className="h-16 flex-col gap-2"
                  onClick={() => handleThemeChange(themeOption.key as any)}
                >
                  <div className={`w-6 h-6 rounded-full ${themeOption.color}`} />
                  <span className="text-xs">{themeOption.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* AI Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <Label className="text-base font-medium">تنظیمات هوش مصنوعی</Label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>رتبه‌بندی خودکار</Label>
                <Switch
                  checked={settings?.auto_ranking_enabled}
                  onCheckedChange={(checked) => updateSettings({ auto_ranking_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>زیر وظایف خودکار</Label>
                <Switch
                  checked={settings?.auto_subtask_enabled}
                  onCheckedChange={(checked) => updateSettings({ auto_subtask_enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>وزن سرعت: {settings?.ai_speed_weight}</Label>
                <Slider
                  value={[settings?.ai_speed_weight || 1]}
                  onValueChange={([value]) => updateSettings({ ai_speed_weight: value })}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>وزن اهمیت: {settings?.ai_importance_weight}</Label>
                <Slider
                  value={[settings?.ai_importance_weight || 1]}
                  onValueChange={([value]) => updateSettings({ ai_importance_weight: value })}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  updateSettings({
                    ai_speed_weight: 1.0,
                    ai_importance_weight: 1.0,
                  })
                }
                className="w-full"
              >
                بازگردانی به پیش‌فرض
              </Button>
            </div>
          </div>

          <Separator />

          {/* Haptic Feedback Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="haptic-feedback-mode">{t('settings.hapticFeedback')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.hapticFeedbackDescription')}
                </p>
              </div>
              <Switch
                id="haptic-feedback-mode"
                checked={hapticFeedbackEnabled}
                onCheckedChange={setHapticFeedbackEnabled}
                aria-label="Toggle haptic feedback"
              />
            </div>
          </div>

          <Separator />

          {/* API Key Management */}
          <div className="space-y-4">
            <Label className="text-base font-medium">مدیریت کلید API</Label>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="کلید API جمینی"
                value={settings?.gemini_api_key || ""}
                onChange={(e) => updateSettings({ gemini_api_key: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">کلید API برای استفاده از قابلیت‌های هوشمند مورد نیاز است</p>
            </div>
          </div>

          <Separator />

          {/* Account Actions */}
          <div className="space-y-4">
            <Label className="text-base font-medium">حساب کاربری</Label>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Button variant="destructive" onClick={handleSignOut} className="w-full">
                <LogOut className="w-4 h-4 ml-2" />
                خروج از حساب
              </Button>
            </div>
          </div>
          </TabsContent>
          <TabsContent value="achievements" className="flex-1 overflow-y-auto py-6"> {/* Added flex-1 and overflow for scrolling */}
            <AchievementsPanel />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
