"use client";
import { useAppStore } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge"; // Import Badge
import { useTranslations } from "next-intl";
import { CheckCircle2, Clock, Inbox, Star } from "lucide-react";
import type { Task } from "@/types"; // Import Task type

interface TaskTabsProps { // Add interface for props
  tasks: Task[];
}

export function TaskTabs({ tasks }: TaskTabsProps) { // Add tasks to props
  const t = useTranslations("tabs");
  const { activeTab, setActiveTab } = useAppStore();

  // Calculate counts
  const allCount = tasks.filter(t => !t.is_archived).length;
  const todayCount = tasks.filter(t => {
    if (t.is_archived) return false;
    if (!t.due_date) return false;
    const today = new Date();
    const dueDate = new Date(t.due_date);
    // Compare year, month, and day components for accuracy
    return today.getFullYear() === dueDate.getFullYear() &&
           today.getMonth() === dueDate.getMonth() &&
           today.getDate() === dueDate.getDate();
  }).length;
  const importantCount = tasks.filter(t => !t.is_archived && (t.ai_importance_score || 0) >= 15).length;
  const completedCount = tasks.filter(t => t.is_completed && !t.is_archived).length;

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2">
          <Inbox className="w-4 h-4" />
          <span className="hidden sm:inline">{t("all")}</span>
          {allCount > 0 && <Badge variant="secondary" className="ml-1 h-5 text-xs px-1.5 sm:px-2">{allCount}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="today" className="flex items-center gap-1 sm:gap-2">
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">{t("today")}</span>
          {todayCount > 0 && <Badge variant="secondary" className="ml-1 h-5 text-xs px-1.5 sm:px-2">{todayCount}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="important" className="flex items-center gap-1 sm:gap-2">
          <Star className="w-4 h-4" />
          <span className="hidden sm:inline">{t("important")}</span>
          {importantCount > 0 && <Badge variant="secondary" className="ml-1 h-5 text-xs px-1.5 sm:px-2">{importantCount}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex items-center gap-1 sm:gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t("completed")}</span>
          {completedCount > 0 && <Badge variant="secondary" className="ml-1 h-5 text-xs px-1.5 sm:px-2">{completedCount}</Badge>}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
