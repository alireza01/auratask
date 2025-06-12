"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useAppStore } from "@/lib/store"
import { useTheme } from "@/components/theme/theme-provider"
import { supabase } from "@/lib/supabase-client"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Palette, Brain, User } from "lucide-react"

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const { user, setUser } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      onOpenChange(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleUpdateSettings = async (updates: Partial<typeof user>) => {
    if (!user) return

    try {
      setLoading(true)
      const { error } = await supabase.from("users").update(updates).eq("id", user.id)

      if (error) throw error

      setUser({ ...user, ...updates })
      toast({
        title: t("common.success"),
        description: "تنظیمات با موفقیت به‌روزرسانی شد",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: t("common.error"),
        description: "خطا در به‌روزرسانی تنظیمات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = (newTheme: "default" | "alireza" | "neda") => {
    setTheme(newTheme)
    handleUpdateSettings({ theme: newTheme })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t("settings.settings")}
          </SheetTitle>
          <SheetDescription>تنظیمات حساب کاربری و شخی‌سازی برنامه</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Theme Settings */}
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
                  checked={user?.auto_ranking_enabled}
                  onCheckedChange={(checked) => handleUpdateSettings({ auto_ranking_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>زیر وظایف خودکار</Label>
                <Switch
                  checked={user?.auto_subtask_enabled}
                  onCheckedChange={(checked) => handleUpdateSettings({ auto_subtask_enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>وزن سرعت: {user?.ai_speed_weight}</Label>
                <Slider
                  value={[user?.ai_speed_weight || 1]}
                  onValueChange={([value]) => handleUpdateSettings({ ai_speed_weight: value })}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>وزن اهمیت: {user?.ai_importance_weight}</Label>
                <Slider
                  value={[user?.ai_importance_weight || 1]}
                  onValueChange={([value]) => handleUpdateSettings({ ai_importance_weight: value })}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  handleUpdateSettings({
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

          {/* API Key Management */}
          <div className="space-y-4">
            <Label className="text-base font-medium">مدیریت کلید API</Label>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="کلید API جمینی"
                value={user?.gemini_api_key || ""}
                onChange={(e) => handleUpdateSettings({ gemini_api_key: e.target.value })}
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
