"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/lib/store"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Trophy,
  Target,
  Award,
  Crown,
  Gem,
  Flame,
  FlameIcon as Fire,
  Zap,
  Moon,
  Sun,
  Brain,
  FolderOpen,
  Star,
  Users,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Achievement {
  id: string
  name: string
  description: string
  icon_name: string
  reward_points: number
  category: string
  rarity: "common" | "rare" | "epic" | "legendary"
  unlocked_at?: string
}

const iconMap = {
  Trophy,
  Target,
  Award,
  Crown,
  Gem,
  Flame,
  Fire,
  Zap,
  Moon,
  Sun,
  Brain,
  FolderOpen,
  Star,
  Users,
  Lock,
}

const rarityColors = {
  common: "from-gray-400 to-gray-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-yellow-400 to-orange-500",
}

const rarityBorders = {
  common: "border-gray-300",
  rare: "border-blue-300",
  epic: "border-purple-300",
  legendary: "border-yellow-300",
}

export function AchievementsPanel() {
  const { user, settings } = useAppStore()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAchievements()
    }
  }, [user])

  const fetchAchievements = async () => {
    try {
      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("category", { ascending: true })

      if (achievementsError) throw achievementsError

      // Fetch user's unlocked achievements
      const { data: unlockedAchievements, error: userError } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user?.id)

      if (userError) throw userError

      const unlockedIds = unlockedAchievements?.map((ua) => ua.achievement_id) || []

      setAchievements(allAchievements || [])
      setUserAchievements(unlockedIds)
    } catch (error) {
      console.error("Error fetching achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAchievementsByCategory = (category: string) => {
    return achievements.filter((a) => a.category === category)
  }

  const getUnlockedCount = (category?: string) => {
    const categoryAchievements = category ? achievements.filter((a) => a.category === category) : achievements

    return categoryAchievements.filter((a) => userAchievements.includes(a.id)).length
  }

  const getTotalPoints = () => {
    return achievements.filter((a) => userAchievements.includes(a.id)).reduce((sum, a) => sum + a.reward_points, 0)
  }

  const categories = [
    { key: "all", name: "همه", icon: Trophy },
    { key: "tasks", name: "وظایف", icon: Target },
    { key: "streaks", name: "تداوم", icon: Flame },
    { key: "special", name: "ویژه", icon: Star },
    { key: "ai", name: "هوش مصنوعی", icon: Brain },
    { key: "organization", name: "سازماندهی", icon: FolderOpen },
    { key: "social", name: "اجتماعی", icon: Users },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">دستاوردهای کسب شده</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUnlockedCount()}</div>
            <p className="text-xs text-muted-foreground">از {achievements.length} دستاورد</p>
            <Progress value={(getUnlockedCount() / achievements.length) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">امتیاز کل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalPoints()}</div>
            <p className="text-xs text-muted-foreground">امتیاز دستاوردها</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">سطح فعلی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings?.level || 1}</div>
            <p className="text-xs text-muted-foreground">{settings?.aura_points || 0} امتیاز آئورا</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          {categories.map((category) => {
            const Icon = category.icon
            const count = category.key === "all" ? getUnlockedCount() : getUnlockedCount(category.key)

            return (
              <TabsTrigger key={category.key} value={category.key} className="flex flex-col gap-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs">{category.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.key} value={category.key}>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                <AnimatePresence>
                  {(category.key === "all" ? achievements : getAchievementsByCategory(category.key)).map(
                    (achievement) => {
                      const isUnlocked = userAchievements.includes(achievement.id)
                      const IconComponent = iconMap[achievement.icon_name as keyof typeof iconMap] || Trophy

                      return (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card
                            className={cn(
                              "relative overflow-hidden transition-all duration-300",
                              isUnlocked
                                ? `${rarityBorders[achievement.rarity]} border-2 shadow-lg`
                                : "border-muted opacity-60",
                              isUnlocked && "hover:shadow-xl",
                            )}
                          >
                            {isUnlocked && (
                              <div
                                className={cn(
                                  "absolute top-0 right-0 w-full h-1",
                                  `bg-gradient-to-r ${rarityColors[achievement.rarity]}`,
                                )}
                              />
                            )}

                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div
                                  className={cn(
                                    "p-2 rounded-lg",
                                    isUnlocked
                                      ? `bg-gradient-to-br ${rarityColors[achievement.rarity]} text-white`
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  <IconComponent className="w-6 h-6" />
                                </div>

                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={isUnlocked ? "default" : "secondary"}
                                    className={cn(
                                      isUnlocked && `bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white`,
                                    )}
                                  >
                                    {achievement.rarity}
                                  </Badge>
                                  {!isUnlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent>
                              <CardTitle className="text-base mb-1">{achievement.description}</CardTitle>
                              <CardDescription className="text-sm">{achievement.name}</CardDescription>

                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-1">
                                  <Trophy className="w-4 h-4 text-yellow-500" />
                                  <span className="text-sm font-medium">{achievement.reward_points} امتیاز</span>
                                </div>

                                {isUnlocked && (
                                  <Badge variant="outline" className="text-xs">
                                    ✓ کسب شده
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    },
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
