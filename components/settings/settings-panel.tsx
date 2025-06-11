"use client"

import { useToast } from "@/components/ui/use-toast"
import ApiKeyManager from "./api-key-manager"
import ThemeSelector from "./theme-selector"
import type { User, UserSettings, GuestUser } from "@/types"

interface SettingsPanelProps {
  user: User | GuestUser | null
  settings: UserSettings | null
  onSettingsChange: (newSettings: Partial<UserSettings>) => void
  isOpen: boolean
  onClose: () => void
}

export default function SettingsPanel({
  user,
  settings,
  onSettingsChange,
}: SettingsPanelProps) {
  const { toast } = useToast()

  const handleSettingsChange = async (newSettings: Partial<UserSettings>) => {
    try {
      await onSettingsChange(newSettings)
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!user || !settings) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Settings</h2>
        <div className="grid gap-4">
          <ApiKeyManager 
            user={user} 
            settings={settings} 
            onSettingsChange={() => handleSettingsChange({})} 
          />
          <ThemeSelector 
            user={user}
            settings={settings} 
            onSettingsChange={() => handleSettingsChange({})} 
          />
        </div>
      </div>
    </div>
  )
}
