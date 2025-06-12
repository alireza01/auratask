"use client"
import { useAppStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"

export function TaskFilters() {
  const t = useTranslations("filters")
  const { filters, setFilter, clearFilters, groups, tags } = useAppStore()

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
      <Input
        placeholder={t("searchTasks")}
        value={filters.searchQuery}
        onChange={(e) => setFilter({ searchQuery: e.target.value })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Group Filter Select */}
        <Select value={filters.filterGroup || ""} onValueChange={(v) => setFilter({ filterGroup: v === "all" ? null : v })}>
          <SelectTrigger>
            <SelectValue placeholder={t("filterByGroup")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allGroups")}</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.emoji} {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter Select */}
        <Select value={filters.filterStatus} onValueChange={(v) => setFilter({ filterStatus: v as any })}>
          <SelectTrigger>
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="active">{t("active")}</SelectItem>
            <SelectItem value="completed">{t("completed")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter Select */}
        <Select value={filters.filterPriority} onValueChange={(v) => setFilter({ filterPriority: v as any })}>
          <SelectTrigger>
            <SelectValue placeholder={t("filterByPriority")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allPriorities")}</SelectItem>
            <SelectItem value="high">{t("high")}</SelectItem>
            <SelectItem value="medium">{t("medium")}</SelectItem>
            <SelectItem value="low">{t("low")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Tag Filter Select */}
        <Select value={filters.filterTag || ""} onValueChange={(v) => setFilter({ filterTag: v === "all" ? null : v })}>
          <SelectTrigger>
            <SelectValue placeholder={t("filterByTag")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTags")}</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="ghost" onClick={clearFilters} size="sm">
        <X className="w-4 h-4 mr-2" />
        {t("clearFilters")}
      </Button>
    </div>
  )
}
