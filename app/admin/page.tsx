"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [userGrowth, setUserGrowth] = useState([])
  const [taskStats, setTaskStats] = useState([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(true)

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
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
            پنل مدیریت
          </h1>
          <p className="text-muted-foreground">نظارت و مدیریت سیستم آئورا تسک</p>
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
            <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeUsers} کاربر فعال (30 روز گذشته)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل وظایف</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTasks}</div>
            <p className="text-xs text-muted-foreground">در سیستم ثبت شده</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">استفاده از AI</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.aiPercentage}%</div>
            <p className="text-xs text-muted-foreground">{stats?.aiTasks} وظیفه با AI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کلیدهای API</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
            <p className="text-xs text-muted-foreground">{apiKeys.filter((k) => k.is_active).length} فعال</p>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">آنالیتیکس</TabsTrigger>
          <TabsTrigger value="logs">لاگ‌ها</TabsTrigger>
          <TabsTrigger value="api-keys">کلیدهای API</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>رشد کاربران (30 روز گذشته)</CardTitle>
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
                <CardTitle>آمار وظایف (30 روز گذشته)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taskStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="created" fill="#8884d8" name="ایجاد شده" />
                    <Bar dataKey="completed" fill="#82ca9d" name="تکمیل شده" />
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
                لاگ‌های سیستم
              </CardTitle>
              <CardDescription>رویدادهای مهم و خطاهای سیستم</CardDescription>
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
                          <summary className="cursor-pointer">جزئیات</summary>
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
              <CardTitle>مدیریت کلیدهای API</CardTitle>
              <CardDescription>مدیریت کلیدهای API جمینی برای پشتیبانی از کاربران</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AdminApiKeyForm onSuccess={fetchAdminData} />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>کلید API (پوشیده)</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تعداد استفاده</TableHead>
                    <TableHead>تاریخ ایجاد</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-mono">****{key.api_key.slice(-4)}</TableCell>
                      <TableCell>
                        <Badge variant={key.is_active ? "default" : "secondary"}>
                          {key.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                      </TableCell>
                      <TableCell>{key.usage_count}</TableCell>
                      <TableCell>{new Date(key.created_at).toLocaleDateString("fa-IR")}</TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Toggle API key status
                            fetch(`/api/admin/toggle-api-key?id=${key.id}`, { method: "POST" }).then(() =>
                              fetchAdminData(),
                            )
                          }}
                        >
                          {key.is_active ? "غیرفعال" : "فعال"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("آیا مطمئن هستید؟")) {
                              fetch(`/api/admin/delete-api-key?id=${key.id}`, { method: "POST" }).then(() =>
                                fetchAdminData(),
                              )
                            }
                          }}
                        >
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
