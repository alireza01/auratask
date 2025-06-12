"use client"

import type React from "react"

import { forwardRef } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface InteractiveButtonProps extends Omit<ButtonProps, "onClick"> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  haptic?: boolean
  motionProps?: HTMLMotionProps<"button">
}

export const InteractiveButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ className, onClick, haptic = true, motionProps, children, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Trigger haptic feedback
      if (haptic && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50)
      }

      onClick?.(event)
    }

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...motionProps}
      >
        <Button
          ref={ref}
          className={cn("transition-all duration-200 hover:shadow-lg active:shadow-sm", className)}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    )
  },
)

InteractiveButton.displayName = "InteractiveButton"
