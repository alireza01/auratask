"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Task, TaskGroup } from "@/types"
import { useAppStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Trash2, Database, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataBlockProps {
  group: TaskGroup
  tasks: Task[]
  onDelete: () => void
  onClick: () => void
}

function DataBlock({ group, tasks, onDelete, onClick }: DataBlockProps) {
  const [isHeld, setIsHeld] = useState(false)
  const [deleteReady, setDeleteReady] = useState(false)
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null)

  const completedTasks = tasks.filter((task) => task.is_completed).length
  const totalTasks = tasks.length
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [])

  const handlePointerDown = useCallback(() => {
    setIsHeld(true)
    triggerHaptic()

    const timer = setTimeout(() => {
      if (isHeld) {
        setDeleteReady(true)
        triggerHaptic()
      }
    }, 800)

    setHoldTimer(timer)
  }, [isHeld, triggerHaptic])

  const handlePointerUp = useCallback(() => {
    if (holdTimer) {
      clearTimeout(holdTimer)
      setHoldTimer(null)
    }

    if (!deleteReady) {
      onClick()
      triggerHaptic()
    }

    setIsHeld(false)
    setDeleteReady(false)
  }, [holdTimer, deleteReady, onClick, triggerHaptic])

  const handleDelete = useCallback(() => {
    triggerHaptic()
    onDelete()
  }, [onDelete, triggerHaptic])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8, rotateX: -90 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        exit={{
          opacity: 0,
          scale: 0,
          clipPath: "polygon(0% 0%, 100% 0%, 50% 50%, 0% 100%)",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          exit: { duration: 0.6, ease: "easeInOut" },
        }}
        whileHover={{
          x: [0, -2, 3, -1, 0],
          filter: [
            "saturate(1) hue-rotate(0deg)",
            "saturate(1.5) hue-rotate(5deg)",
            "saturate(0.9) hue-rotate(-3deg)",
            "saturate(1.2) hue-rotate(2deg)",
            "saturate(1) hue-rotate(0deg)",
          ],
          boxShadow: [
            "0 0 15px rgba(255, 214, 10, 0.4)",
            "0 0 25px rgba(255, 214, 10, 0.6)",
            "0 0 20px rgba(255, 214, 10, 0.5)",
            "0 0 15px rgba(255, 214, 10, 0.4)",
          ],
        }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative p-6 rounded-lg backdrop-blur-md border-2 cursor-pointer",
          "bg-gray-900/80 border-yellow-400 yellow-glow",
          "transition-all duration-200",
          deleteReady && "border-red-500 shadow-red-500/50",
        )}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Glitch overlay effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent"
          animate={{
            x: ["-100%", "100%"],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="text-3xl"
                animate={deleteReady ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.3, repeat: deleteReady ? Number.POSITIVE_INFINITY : 0 }}
              >
                {group.emoji}
              </motion.div>
              <div>
                <h3 className="font-bold text-lg text-yellow-400">{group.name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Database className="w-3 h-3" />
                  <span>DATA_BLOCK_{group.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {deleteReady && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDelete}
                  className="p-2 bg-red-500/80 backdrop-blur-md rounded-lg text-white hover:bg-red-600/80 transition-colors border border-red-400/50"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30">
              <Zap className="w-3 h-3 mr-1" />
              {totalTasks} TASKS
            </Badge>
            {completedTasks > 0 && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✓ {completedTasks} COMPLETE</Badge>
            )}
          </div>

          {totalTasks > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>PROGRESS</span>
                <span>{Math.round(completionPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Digital noise pattern */}
          <div className="absolute bottom-2 right-2 opacity-20">
            <motion.div
              className="text-xs font-mono text-yellow-400"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              {Array.from({ length: 8 }, () => Math.random().toString(2).substr(2, 1)).join("")}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

interface AlirezaDataBlockGroupProps {
  groups: TaskGroup[]
  tasks: Task[]
  onGroupClick: (groupId: string) => void
}

export function AlirezaDataBlockGroup({ groups, tasks, onGroupClick }: AlirezaDataBlockGroupProps) {
  const { deleteGroup } = useAppStore()

  const groupedTasks = groups.map((group) => ({
    ...group,
    tasks: tasks.filter((task) => task.group_id === group.id),
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <AnimatePresence>
        {groupedTasks.map((group) => (
          <DataBlock
            key={group.id}
            group={group}
            tasks={group.tasks}
            onDelete={() => deleteGroup(group.id)}
            onClick={() => onGroupClick(group.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
