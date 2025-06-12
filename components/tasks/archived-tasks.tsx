"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { TaskCard } from "./TaskCard"; // Corrected import path to PascalCase
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

export function ArchivedTasks() {
  const t = useTranslations("tasks");
  const tasks = useAppStore((state) => state.tasks);
  const [isOpen, setIsOpen] = useState(false);

  // Changed filter from task.completed to task.is_archived
  const archivedTasks = tasks.filter((task) => task.is_archived);

  // Update conditional rendering based on archivedTasks
  if (archivedTasks.length === 0) return null;

  return (
    <Card className="bg-muted/50">
      <CardHeader
        className="flex-row items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Changed translation key and count variable */}
        <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
          <Archive className="w-4 h-4" />
          {t("archivedTasksTitle")} ({archivedTasks.length})
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
              {/* Changed iteration variable */}
              {archivedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
