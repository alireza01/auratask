"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { AdminApiKeyForm } from "@/components/admin/AdminApiKeyForm"
import { Users, Activity, Brain, AlertTriangle, TrendingUp, Database } from "lucide-react"
import { motion } from "framer-motion"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalTasks: number
  aiTasks: number
  aiPercentage: number
}

interface LogEntry {
  id: string
  created_at: string
  level: string
  message: string
  metadata: any
  is_resolved: boolean
}

// Interface for API keys as fetched from Supabase
interface ApiKeyClient {
  id: string
  api_key: string // from DB
  is_active: boolean // from DB
  created_at: string
  usage_count?: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [userGrowth, setUserGrowth] = useState([])
  const [taskStats, setTaskStats] = useState([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKeyClient[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations("admin")

  const supabase = createClient()

  useEffect(() => {
    fetchAdminData()

    // Subscribe to real-time log updates
    const logsSubscription = supabase
      .channel("admin_logs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_logs" }, (payload) => {
        setLogs((prev) => [payload.new as LogEntry, ...prev])
      })
      .subscribe()

    return () => {
      logsSubscription.unsubscribe()
    }
  }, [])

  const fetchAdminData = async () => {
    try {
      // Fetch basic stats
      const [
        { data: userCount },
        { data: activeUserCount },
        { data: aiStats },
        { data: userGrowthData },
        { data: taskStatsData },
        { data: logsData },
        { data: apiKeysData },
      ] = await Promise.all([
        supabase.from("user_settings").select("count"),
        supabase
          .from("user_settings")
          .select("count")
          .gt("updated_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.rpc("get_ai_usage_stats"),
        supabase.rpc("get_daily_user_growth", { days: 30 }),
        supabase.rpc("get_task_completion_stats", { days: 30 }),
        supabase.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("admin_api_keys").select("*").order("created_at", { ascending: false }),
      ])

      setStats({
        totalUsers: userCount?.[0]?.count || 0,
        activeUsers: activeUserCount?.[0]?.count || 0,
        totalTasks: aiStats?.[0]?.total_tasks || 0,
        aiTasks: aiStats?.[0]?.total_ai_tasks || 0,
        aiPercentage: aiStats?.[0]?.ai_percentage || 0,
      })

      setUserGrowth(userGrowthData || [])
      setTaskStats(taskStatsData || [])
      setLogs(logsData || [])
      setApiKeys(apiKeysData || [])
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "INFO":
        return "bg-blue-100 text-blue-800"
      case "WARNING":
        return "bg-yellow-100 text-yellow-800"
      case "ERROR":
        return "bg-red-100 text-red-800"
      case "FATAL":
        return "bg-red-200 text-red-900"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"]

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          {/* Using h1 for semantic loading title, though it's visually simple */}
          <h1 className="h-8 bg-gray-200 rounded w-1/4 text-transparent">{t("loading")}</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="w-8 h-8 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers} {t("activeUsers")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalTasks")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTasks}</div>
            <p className="text-xs text-muted-foreground">{t("registeredInSystem")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("aiUsage")}</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.aiPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.aiTasks} {t("aiTasks")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("apiKeys")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
            <p className="text-xs text-muted-foreground">
              {apiKeys.filter((k) => k.is_active).length} {t("active")}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">{t("analytics")}</TabsTrigger>
          <TabsTrigger value="logs">{t("logs")}</TabsTrigger>
          <TabsTrigger value="api-keys">{t("apiKeys")}</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("userGrowth30Days")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("taskStats30Days")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taskStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="created" fill="#8884d8" name={t("created")} />
                    <Bar dataKey="completed" fill="#82ca9d" name={t("completed")} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {t("systemLogs")}
              </CardTitle>
              <CardDescription>{t("systemEventsErrors")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(log.level)}>{log.level}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("fa-IR")}
                        </span>
                      </div>
                      <p className="text-sm">{log.message}</p>
                      {log.metadata && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer">{t("details")}</summary>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("manageApiKeys")}</CardTitle>
              <CardDescription>{t("manageApiKeysDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AdminApiKeyForm
                apiKeys={apiKeys.map((ak) => ({
                  id: ak.id,
                  key: ak.api_key, // Map api_key to key
                  active: ak.is_active, // Map is_active to active
                  created_at: ak.created_at,
                  usage_count: ak.usage_count,
                }))}
                onSuccess={fetchAdminData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
