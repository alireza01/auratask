"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, Sparkles, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface LevelUpNotificationProps {
  newLevel: number
  onClose: () => void
}

export function LevelUpNotification({ newLevel, onClose }: LevelUpNotificationProps) {
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    // Trigger haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200])
    }

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            duration: 0.6,
          }}
          onClick={(e) => e.stopPropagation()}
          className="relative"
        >
          {/* Confetti Background */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "absolute w-2 h-2 rounded-full",
                    i % 4 === 0 && "bg-yellow-400",
                    i % 4 === 1 && "bg-pink-400",
                    i % 4 === 2 && "bg-blue-400",
                    i % 4 === 3 && "bg-green-400",
                  )}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    rotate: 0,
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400,
                    scale: [0, 1, 0],
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}

          <Card className="p-8 max-w-md mx-4 text-center relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-pink-400/20 to-purple-400/20" />

            {/* Floating Icons */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="relative z-10"
            >
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Crown className="w-16 h-16 text-yellow-500" />
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className="absolute inset-0"
                  >
                    <Crown className="w-16 h-16 text-yellow-300" />
                  </motion.div>
                </div>
              </div>

              <motion.h1
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
              >
                تبریک! سطح بالا رفت!
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <div className="text-6xl font-bold text-primary mb-2">{newLevel}</div>
                <p className="text-muted-foreground">شما به سطح {newLevel} رسیدید!</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center gap-2 mb-6"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.8 + i * 0.1,
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Star className="w-6 h-6 text-yellow-400 fill-current" />
                  </motion.div>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-yellow-400 to-pink-400 hover:from-yellow-500 hover:to-pink-500 text-white font-semibold px-8"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  عالی!
                </Button>
              </motion.div>
            </motion.div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
