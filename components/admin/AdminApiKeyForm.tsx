"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface ApiKey {
  id: string
  key: string // This is the actual API key string
  active: boolean // Corresponds to is_active
  created_at: string
  usage_count?: number // From admin_api_keys table
}

export function AdminApiKeyForm({ apiKeys = [], onSuccess }: { apiKeys: ApiKey[]; onSuccess?: () => void }) {
  const [newApiKeyString, setNewApiKeyString] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newApiKeyString.trim()) {
      toast.error("Please enter an API key")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/add-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: newApiKeyString.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add API key")
      }

      toast.success("API key added successfully")
      setNewApiKeyString("")
      onSuccess?.()
    } catch (error: any) {
      toast.error("Failed to add API key: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleApiKey = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/toggle-api-key?id=${id}`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to toggle API key")
      }

      toast.success(`API key ${currentStatus ? "disabled" : "enabled"} successfully`)
      onSuccess?.()
    } catch (error: any) {
      toast.error("Failed to toggle API key: " + error.message)
    }
  }

  const handleDeleteApiKey = async (id: string, apiKeyIdentifier: string) => {
    if (!confirm(`Are you sure you want to delete the API key ending in "...${apiKeyIdentifier.slice(-4)}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/delete-api-key?id=${id}`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete API key")
      }

      toast.success(`API key ending in "...${apiKeyIdentifier.slice(-4)}" deleted successfully`)
      onSuccess?.()
    } catch (error: any) {
      toast.error("Failed to delete API key: " + error.message)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Fallback API Key</CardTitle>
          <CardDescription>Add a new Gemini API key to be used as a fallback.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddApiKey} className="flex items-end gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="newApiKeyStringInput">API Key</Label>
              <Input
                id="newApiKeyStringInput"
                type="password"
                placeholder="Paste Gemini API Key here"
                value={newApiKeyString}
                onChange={(e) => setNewApiKeyString(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !newApiKeyString.trim()}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Adding..." : "Add Key"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground pt-2">
            API keys are stored securely and used as fallbacks when users don&apos;t have their own keys.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage API Keys</CardTitle>
          <CardDescription>View, enable/disable, or delete existing API keys.</CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No API keys found</p>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex flex-col gap-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Key: ****{apiKey.key.slice(-4)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(apiKey.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm">Usage: {apiKey.usage_count ?? 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={apiKey.active}
                          onCheckedChange={() => handleToggleApiKey(apiKey.id, apiKey.active)}
                          id={`active-${apiKey.id}`}
                        />
                        <Label htmlFor={`active-${apiKey.id}`}>{apiKey.active ? "Active" : "Inactive"}</Label>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteApiKey(apiKey.id, apiKey.key)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {/* Optional: Display full key or other details if needed, or remove this section */}
                  {/* <div className="bg-muted p-2 rounded-md">
                    <code className="text-xs break-all">{apiKey.key}</code>
                  </div> */}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Manage your pool of fallback API keys.
        </CardFooter>
      </Card>
    </div>
  )
}
