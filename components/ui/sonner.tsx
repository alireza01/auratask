"use client"

import { useTheme } from "@/components/theme/theme-provider" // Updated import path
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme: currentAppContextTheme } = useTheme() // Get theme from our custom provider

  let sonnerTheme: ToasterProps["theme"] = "light"; // Default for Sonner
  if (currentAppContextTheme === "dark" || currentAppContextTheme === "alireza") {
    // "alireza" theme also applies "dark" class as per theme-provider.tsx
    sonnerTheme = "dark";
  } else {
    sonnerTheme = "light"; // "light" or "neda" themes
  }

  return (
    <Sonner
      theme={sonnerTheme} // Use the mapped theme
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
