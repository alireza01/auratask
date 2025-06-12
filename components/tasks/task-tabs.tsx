"use client"
import { useAppStore } from "@/lib/store"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "next-intl"
import { CheckCircle2, Clock, Inbox, Star } from "lucide-react"

export function TaskTabs() {
  const t = useTranslations("tabs")
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all" className="flex items-center gap-2">
          <Inbox className="w-4 h-4" />
          <span className="hidden sm:inline">{t("all")}</span>
        </TabsTrigger>
        <TabsTrigger value="today" className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">{t("today")}</span>
        </TabsTrigger>
        <TabsTrigger value="important" className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          <span className="hidden sm:inline">{t("important")}</span>
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t("completed")}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
