"use client"
import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { TaskCard } from "./task-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Archive, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "next-intl"

export function CompletedTasks() {
  const t = useTranslations("tasks")
  const tasks = useAppStore((state) => state.tasks)
  const [isOpen, setIsOpen] = useState(false)

  const completedTasks = tasks.filter((task) => task.is_completed)

  if (completedTasks.length === 0) return null

  return (
    <Card className="bg-muted/50">
      <CardHeader
        className="flex-row items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
          <Archive className="w-4 h-4" />
          {t("completedTasks")} ({completedTasks.length})
        </CardTitle>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </CardHeader>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="p-4 pt-0 space-y-3">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
