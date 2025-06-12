"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Key, Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface ApiKeySetupGuideProps {
  onComplete: () => void
  onSkip: () => void
}

export function ApiKeySetupGuide({ onComplete, onSkip }: ApiKeySetupGuideProps) {
  const { updateSettings } = useAppStore()
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("لطفاً کلید API را وارد کنید")
      return
    }

    try {
      setLoading(true)
      await updateSettings({ gemini_api_key: apiKey.trim() })
      toast.success("کلید API با موفقیت ذخیره شد")
      onComplete()
    } catch (error) {
      console.error("Error saving API key:", error)
      toast.error("خطا در ذخیره کلید API")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center relative">
          <Button variant="ghost" size="icon" className="absolute left-4 top-4" onClick={onSkip}>
            <X className="h-4 w-4" />
          </Button>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">تنظیم کلید API جمینی</CardTitle>
          <CardDescription>برای استفاده از قابلیت‌های هوشمند، کلید API جمینی مورد نیاز است</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">مراحل دریافت کلید API:</h3>
            <div className="space-y-3">
              {[
                "به Google AI Studio بروید",
                'روی "Get API Key" کلیک کنید',
                "کلید جدید ایجاد کنید",
                "کلید را کپی کرده و در زیر وارد کنید",
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}
            >
              <ExternalLink className="ml-2 h-4 w-4" />
              باز کردن Google AI Studio
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">کلید API جمینی</label>
              <Input
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveApiKey} disabled={loading || !apiKey.trim()} className="flex-1" size="lg">
                {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                ذخیره کلید API
              </Button>
              <Button variant="outline" onClick={onSkip} size="lg">
                فعلاً رد کن
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
