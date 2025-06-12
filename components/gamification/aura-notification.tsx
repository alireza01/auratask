"use client"
import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Star } from "lucide-react"
import { Card } from "@/components/ui/card"

export function AuraNotification() {
  const { lastAuraReward, clearAuraReward } = useAppStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (lastAuraReward) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => clearAuraReward(), 300)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [lastAuraReward, clearAuraReward])

  return (
    <AnimatePresence>
      {isVisible && lastAuraReward && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Card className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="w-6 h-6" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <Star className="w-6 h-6" />
                </motion.div>
              </div>
              <div>
                <p className="font-bold">+{lastAuraReward.points} آئورا!</p>
                <p className="text-sm opacity-90">{lastAuraReward.reason}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
