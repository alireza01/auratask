import { format, formatDistanceToNow } from "date-fns"
// Fix: Use the correct Persian locale import
import { faIR } from "date-fns/locale"

export const formatDate = (date: Date | string, formatStr = "PPP") => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, formatStr, { locale: faIR })
}

export const formatRelativeTime = (date: Date | string) => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: faIR })
}

export const getDirection = (locale: string) => {
  return locale === "fa" ? "rtl" : "ltr"
}

export const getLocaleMessages = async (locale: string) => {
  try {
    const messages = await import(`../messages/${locale}.json`)
    return messages.default
  } catch (error) {
    // Fallback to English if locale not found
    const messages = await import("../messages/en.json")
    return messages.default
  }
}
