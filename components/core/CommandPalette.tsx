"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { useAppStore } from "@/lib/store"
import { useTheme } from "@/components/theme/theme-provider"
import { supabase } from "@/lib/supabase-client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Home, Trophy, Settings, Plus, Users, Moon, Sun, LogOut, Palette, Shield, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user, settings, openTaskForm, openGroupForm, toggleSettingsPanel, setDarkMode, darkMode } = useAppStore()
  const { theme, setTheme } = useTheme()

  // Check if user is admin
  const isAdmin = settings?.username === "admin"

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="جستجو در دستورات..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm">هیچ نتیجه‌ای یافت نشد.</Command.Empty>

            <Command.Group heading="ناوبری">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/"))}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Home className="h-4 w-4" />
                <span>رفتن به داشبورد</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/leaderboard"))}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="h-4 w-4" />
                <span>رفتن به جدول امتیازات</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => toggleSettingsPanel(true))}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span>باز کردن تنظیمات</span>
              </Command.Item>
              {isAdmin && (
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/admin"))}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Shield className="h-4 w-4" />
                  <span>پنل مدیریت</span>
                </Command.Item>
              )}
            </Command.Group>

            <Command.Group heading="اقدامات اصلی">
              <Command.Item
                onSelect={() => runCommand(() => openTaskForm())}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>ایجاد وظیفه جدید</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => openGroupForm())}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Users className="h-4 w-4" />
                <span>ایجاد گروه جدید</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="تم و ظاهر">
              <Command.Item
                onSelect={() => runCommand(() => setTheme("default"))}
                className={cn("flex items-center gap-2 cursor-pointer", theme === "default" && "bg-accent")}
              >
                <Palette className="h-4 w-4" />
                <span>تم پیش‌فرض</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setTheme("alireza"))}
                className={cn("flex items-center gap-2 cursor-pointer", theme === "alireza" && "bg-accent")}
              >
                <Palette className="h-4 w-4" />
                <span>تم علیرضا</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setTheme("neda"))}
                className={cn("flex items-center gap-2 cursor-pointer", theme === "neda" && "bg-accent")}
              >
                <Palette className="h-4 w-4" />
                <span>تم ندا</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setDarkMode(!darkMode))}
                className="flex items-center gap-2 cursor-pointer"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{darkMode ? "حالت روشن" : "حالت تاریک"}</span>
              </Command.Item>
            </Command.Group>

            {user && (
              <Command.Group heading="جلسه">
                <Command.Item
                  onSelect={() => runCommand(handleSignOut)}
                  className="flex items-center gap-2 cursor-pointer text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>خروج از حساب</span>
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
