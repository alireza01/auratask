"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface ApiKey {
  id: string
  name: string
  key: string
  active: boolean
  created_at: string
}

export function AdminApiKeyForm({ apiKeys = [] }: { apiKeys: ApiKey[] }) {
  const router = useRouter()
  const [newKeyName, setNewKeyName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/add-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newKeyName }),
      })

      if (!response.ok) {
        throw new Error("Failed to add API key")
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: `API key "${newKeyName}" created successfully`,
      })
      setNewKeyName("")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add API key",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleApiKey = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/toggle-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, active: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle API key")
      }

      toast({
        title: "Success",
        description: `API key ${currentStatus ? "disabled" : "enabled"} successfully`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle API key status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteApiKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the API key "${name}"?`)) {
      return
    }

    try {
      const response = await fetch("/api/admin/delete-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete API key")
      }

      toast({
        title: "Success",
        description: `API key "${name}" deleted successfully`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New API Key</CardTitle>
          <CardDescription>Create a new API key for external integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddApiKey} className="flex items-end gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="apiKeyName">API Key Name</Label>
              <Input
                type="text"
                id="apiKeyName"
                placeholder="Enter a name for this API key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isSubmitting ? "Creating..." : "Create Key"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage API Keys</CardTitle>
          <CardDescription>View, enable/disable, or delete existing API keys</CardDescription>
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
                      <h3 className="font-medium">{apiKey.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(apiKey.created_at).toLocaleString()}
                      </p>
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
                      <Button variant="outline" size="icon" onClick={() => handleDeleteApiKey(apiKey.id, apiKey.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted p-2 rounded-md">
                    <code className="text-xs break-all">{apiKey.key}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Note: API keys are shown in full only once when created. Store them securely.
        </CardFooter>
      </Card>
    </div>
  )
}

// Export the component as a named export
