"use client"

import { useState } from "react"
import { Check, ChevronDown, Filter, SortAsc, SortDesc } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

type SortOption = "created_at" | "due_date" | "priority"
type SortDirection = "asc" | "desc"
type FilterOption = "all" | "today" | "week" | "month" | "overdue"
type PriorityOption = "all" | "high" | "medium" | "low"

interface TaskFiltersProps {
  onSortChange: (sort: SortOption, direction: SortDirection) => void
  onFilterChange: (filter: FilterOption) => void
  onPriorityChange: (priority: PriorityOption) => void
  onTagChange: (tag: string | null) => void
  tags: { id: string; name: string; color: string }[]
}

export function TaskFilters({
  onSortChange,
  onFilterChange,
  onPriorityChange,
  onTagChange,
  tags = [],
}: TaskFiltersProps) {
  const [activeSort, setActiveSort] = useState<SortOption>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all")
  const [activePriority, setActivePriority] = useState<PriorityOption>("all")
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const handleSortChange = (sort: SortOption) => {
    setActiveSort(sort)
    onSortChange(sort, sortDirection)
  }

  const toggleSortDirection = () => {
    const newDirection = sortDirection === "asc" ? "desc" : "asc"
    setSortDirection(newDirection)
    onSortChange(activeSort, newDirection)
  }

  const handleFilterChange = (filter: FilterOption) => {
    setActiveFilter(filter)
    onFilterChange(filter)
  }

  const handlePriorityChange = (priority: PriorityOption) => {
    setActivePriority(priority)
    onPriorityChange(priority)
  }

  const handleTagChange = (tagId: string | null) => {
    setActiveTag(tagId)
    onTagChange(tagId)
  }

  const getFilterLabel = (filter: FilterOption) => {
    switch (filter) {
      case "all":
        return "All Tasks"
      case "today":
        return "Due Today"
      case "week":
        return "Due This Week"
      case "month":
        return "Due This Month"
      case "overdue":
        return "Overdue"
    }
  }

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "created_at":
        return "Date Created"
      case "due_date":
        return "Due Date"
      case "priority":
        return "Priority"
    }
  }

  const getPriorityLabel = (priority: PriorityOption) => {
    switch (priority) {
      case "all":
        return "All Priorities"
      case "high":
        return "High Priority"
      case "medium":
        return "Medium Priority"
      case "low":
        return "Low Priority"
    }
  }

  const activeTagName = activeTag ? tags.find((tag) => tag.id === activeTag)?.name : null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <SortAsc className="h-3.5 w-3.5" />
            <span>Sort: {getSortLabel(activeSort)}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => handleSortChange("created_at")}>
              {activeSort === "created_at" && <Check className="mr-2 h-4 w-4" />}
              <span className={activeSort === "created_at" ? "font-medium" : ""}>Date Created</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("due_date")}>
              {activeSort === "due_date" && <Check className="mr-2 h-4 w-4" />}
              <span className={activeSort === "due_date" ? "font-medium" : ""}>Due Date</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("priority")}>
              {activeSort === "priority" && <Check className="mr-2 h-4 w-4" />}
              <span className={activeSort === "priority" ? "font-medium" : ""}>Priority</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Direction Button */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2"
        onClick={toggleSortDirection}
        title={sortDirection === "asc" ? "Ascending" : "Descending"}
      >
        {sortDirection === "asc" ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />}
      </Button>

      {/* Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter: {getFilterLabel(activeFilter)}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Time Filter</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => handleFilterChange("all")}>
              {activeFilter === "all" && <Check className="mr-2 h-4 w-4" />}
              <span className={activeFilter === "all" ? "font-medium" : ""}>All Tasks</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterChange("today")}>
              {activeFilter === "today" && <Check className="mr-2 h-4 w-4" />}
              <span className={activeFilter === "today" ? "font-medium" : ""}>Due Today</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterChange("week")}>
              {activeFilter === "week" && <Check className="mr-2 h-4 w-4" />}
              <span className={activeFilter === "week" ? "font-medium" : ""}>Due This Week</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterChange("month")}>
              {activeFilter === "month" && <Check className="mr-2 h-4 w-4" />}
              <span className={activeFilter === "month" ? "font-medium" : ""}>Due This Month</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterChange("overdue")}>
              {activeFilter === "overdue" && <Check className="mr-2 h-4 w-4" />}
              <span className={activeFilter === "overdue" ? "font-medium" : ""}>Overdue</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <span>Priority: {getPriorityLabel(activePriority)}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Priority Filter</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => handlePriorityChange("all")}>
              {activePriority === "all" && <Check className="mr-2 h-4 w-4" />}
              <span className={activePriority === "all" ? "font-medium" : ""}>All Priorities</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityChange("high")}>
              {activePriority === "high" && <Check className="mr-2 h-4 w-4" />}
              <span className={activePriority === "high" ? "font-medium" : ""}>High Priority</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityChange("medium")}>
              {activePriority === "medium" && <Check className="mr-2 h-4 w-4" />}
              <span className={activePriority === "medium" ? "font-medium" : ""}>Medium Priority</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityChange("low")}>
              {activePriority === "low" && <Check className="mr-2 h-4 w-4" />}
              <span className={activePriority === "low" ? "font-medium" : ""}>Low Priority</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tags Dropdown */}
      {tags.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <span>Tag: {activeTagName || "All Tags"}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => handleTagChange(null)}>
                {activeTag === null && <Check className="mr-2 h-4 w-4" />}
                <span className={activeTag === null ? "font-medium" : ""}>All Tags</span>
              </DropdownMenuItem>
              {tags.map((tag) => (
                <DropdownMenuItem key={tag.id} onClick={() => handleTagChange(tag.id)}>
                  {activeTag === tag.id && <Check className="mr-2 h-4 w-4" />}
                  <div className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: tag.color }} className="w-2 h-2 p-0 rounded-full" />
                    <span className={activeTag === tag.id ? "font-medium" : ""}>{tag.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-1">
        {activeFilter !== "all" && (
          <Badge variant="secondary" className="h-8 px-2 gap-1">
            {getFilterLabel(activeFilter)}
            <button className="ml-1 rounded-full hover:bg-muted p-0.5" onClick={() => handleFilterChange("all")}>
              ×
            </button>
          </Badge>
        )}
        {activePriority !== "all" && (
          <Badge variant="secondary" className="h-8 px-2 gap-1">
            {getPriorityLabel(activePriority)}
            <button className="ml-1 rounded-full hover:bg-muted p-0.5" onClick={() => handlePriorityChange("all")}>
              ×
            </button>
          </Badge>
        )}
        {activeTag && (
          <Badge variant="secondary" className="h-8 px-2 gap-1">
            {activeTagName}
            <button className="ml-1 rounded-full hover:bg-muted p-0.5" onClick={() => handleTagChange(null)}>
              ×
            </button>
          </Badge>
        )}
      </div>
    </div>
  )
}

// Export the component as a named export
