"use client"

import { Suspense, useState, useEffect } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award, Crown, Share2, Users, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"
import { LeaderboardSkeleton } from "@/components/core/LeaderboardSkeleton"
import { createClient } from "@/lib/supabase-client"
import { useAppStore } from "@/lib/store"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface LeaderboardUser {
  id: string
  username: string
  aura_points: number
  level: number
  avatar_url?: string
  current_streak: number
  rank: number
}

function PodiumCard({ user, position }: { user: LeaderboardUser; position: 1 | 2 | 3 }) {
  const t = useTranslations("leaderboard")
  const { theme } = useTheme()

  const podiumColors = {
    1: "from-yellow-400 to-yellow-600",
    2: "from-gray-300 to-gray-500",
    3: "from-amber-600 to-amber-800",
  }

  const podiumIcons = {
    1: <Crown className="w-8 h-8 text-yellow-500" />,
    2: <Trophy className="w-8 h-8 text-gray-400" />,
    3: <Medal className="w-8 h-8 text-amber-600" />,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: position * 0.2, type: "spring", stiffness: 300 }}
      className={cn(
        "relative p-6 rounded-xl border-2 shadow-lg",
        position === 1 &&
          "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
        position === 2 &&
          "border-gray-400 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20",
        position === 3 &&
          "border-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
        theme === "alireza" && "backdrop-blur-md yellow-glow",
      )}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
            <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl font-bold">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="absolute -top-2 -right-2 p-2 bg-white rounded-full shadow-lg">{podiumIcons[position]}</div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold">{user.username}</h3>
          <p className="text-sm text-muted-foreground">{t("level", { level: user.level })}</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {user.aura_points.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">{t("auraPoints")}</p>
        </div>

        {user.current_streak > 0 && (
          <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">
            {t("streakDays", { streak: user.current_streak })}
          </Badge>
        )}
      </div>
    </motion.div>
  )
}

function LeaderboardRow({ user, index }: { user: LeaderboardUser; index: number }) {
  const t = useTranslations("leaderboard")
  const { user: currentUser } = useAppStore()
  const { theme } = useTheme()
  const isCurrentUser = currentUser?.id === user.id

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return null // Handled by podium
    if (rank <= 10) return <Award className="w-5 h-5 text-purple-500" />
    return <Award className="w-5 h-5 text-muted-foreground" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border transition-all duration-200",
        isCurrentUser && "border-primary bg-primary/5 shadow-md",
        !isCurrentUser && "border-border hover:bg-muted/50",
        theme === "alireza" && "bg-gray-900/50 border-yellow-400/30",
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {getRankIcon(user.rank)}
          <Badge variant={user.rank <= 10 ? "default" : "outline"}>#{user.rank}</Badge>
        </div>

        <Avatar className="w-12 h-12">
          <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
          <AvatarFallback className="font-semibold">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div>
          <p className={cn("font-semibold", isCurrentUser && "text-primary")}>
            {user.username}
            {isCurrentUser && ` ${t("you")}`}
          </p>
          <p className="text-sm text-muted-foreground">{t("level", { level: user.level })}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-bold text-lg">{user.aura_points.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">{t("auraPoints")}</p>
      </div>
    </motion.div>
  )
}

function UserRankCard({ user }: { user: LeaderboardUser }) {
  const t = useTranslations("leaderboard")
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
    >
      <Card className="border-primary bg-primary/5 shadow-lg backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-primary">{t("yourRank", { rank: user.rank })}</p>
                <p className="text-sm text-muted-foreground">
                  {t("points", { points: user.aura_points.toLocaleString() })}
                </p>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

async function fetchLeaderboard(page: number, limit = 20) {
  const supabase = createClient()
  const offset = page * limit

  const { data, error } = await supabase
    .from("user_settings")
    .select("id, username, aura_points, level, avatar_url, current_streak")
    .order("aura_points", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return data.map((user, index) => ({
    ...user,
    rank: offset + index + 1,
  }))
}

function LeaderboardContent() {
  const t = useTranslations("leaderboard")
  const { user: currentUser } = useAppStore()
  const { theme } = useTheme()
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ["leaderboard"],
    queryFn: ({ pageParam = 0 }) => fetchLeaderboard(pageParam),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 20 ? pages.length : undefined
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch current user's rank
  useEffect(() => {
    if (currentUser) {
      const fetchUserRank = async () => {
        const supabase = createClient()
        const { data: userSettings } = await supabase
          .from("user_settings")
          .select("id, username, aura_points, level, avatar_url, current_streak")
          .eq("id", currentUser.id)
          .single()

        if (userSettings) {
          const { count } = await supabase
            .from("user_settings")
            .select("*", { count: "exact", head: true })
            .gt("aura_points", userSettings.aura_points)

          setUserRank({
            ...userSettings,
            rank: (count || 0) + 1,
          })
        }
      }

      fetchUserRank()
    }
  }, [currentUser])

  const allUsers = data?.pages.flat() || []
  const topThree = allUsers.slice(0, 3)
  const restUsers = allUsers.slice(3)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("shareTitle"),
          text: t("shareText"),
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (isLoading) return <LeaderboardSkeleton />

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{t("errorLoading")}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              {t("retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageSubtitle")}</p>

        <div className="flex justify-center gap-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Users className="w-4 h-4 mr-2" />
            {t("activeUsers", { count: allUsers.length })}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            {t("share")}
          </Button>
        </div>
      </motion.div>

      {/* Podium - Top 3 */}
      {topThree.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t("podiumTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topThree.map((user, index) => (
                  <PodiumCard key={user.id} user={user} position={(index + 1) as 1 | 2 | 3} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Rest of leaderboard */}
      {restUsers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>{t("fullRanking")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <AnimatePresence>
                  {restUsers.map((user, index) => (
                    <LeaderboardRow key={user.id} user={user} index={index} />
                  ))}
                </AnimatePresence>

                {/* Load more button */}
                {hasNextPage && (
                  <div className="flex justify-center pt-6">
                    <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="outline">
                      {isFetchingNextPage ? t("loadingMore") : t("showMore")}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Current user rank card (if not in top visible) */}
      {userRank && userRank.rank > 20 && <UserRankCard user={userRank} />}
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <LeaderboardContent />
    </Suspense>
  )
}
