"use client"
import { useState } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function AdminApiKeyForm() {
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey.trim()) {
      toast.error("Please enter an API key")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/add-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to add API key")
      }

      toast.success("API key added successfully")
      setApiKey("")
      router.refresh()
    } catch (error) {
      console.error("Error adding API key:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add API key")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="apiKey">Add New API Key</Label>
        <div className="flex gap-2">
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter Gemini API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !apiKey.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Add Key
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          API keys are stored securely and used as fallbacks when users don't have their own keys.
        </p>
      </div>
    </form>
  )
}
