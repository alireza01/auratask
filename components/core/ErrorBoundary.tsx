"use client"

import type React from "react"
import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })

    // Log error to admin system
    this.logErrorToAdmin(error, errorInfo)
  }

  private async logErrorToAdmin(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await supabase.rpc("log_event", {
        p_level: "FATAL",
        p_message: `Frontend Error: ${error.message}`,
        p_metadata: {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          errorInfo: {
            componentStack: errorInfo.componentStack,
          },
          ...(typeof navigator !== "undefined" && { userAgent: navigator.userAgent }),
          ...(typeof window !== "undefined" && { url: window.location.href }),
          timestamp: new Date().toISOString(),
        },
      })
    } catch (logError) {
      console.error("Failed to log error to admin system:", logError)
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl">مشکلی پیش آمده</CardTitle>
              <CardDescription>
                متأسفانه خطایی در برنامه رخ داده است. این مشکل به تیم فنی گزارش شده و به زودی برطرف خواهد شد.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReload} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  تلاش مجدد
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  بازگشت به صفحه اصلی
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <summary className="cursor-pointer font-medium">جزئیات خطا (حالت توسعه)</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs">{this.state.error.stack}</pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
