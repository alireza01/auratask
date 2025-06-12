// lib/toast-notifications.ts
import { toast } from 'sonner';
import { Sparkles, Star, Crown, Trophy, Target, Award, Gem, Flame, Fire, Zap, Moon, Sun, Brain, FolderOpen, Users, Icon as LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

// Assuming Achievement type structure based on schema and usage
export interface Achievement {
  id: bigint;
  name: string; // e.g. "first_task" - used as subtitle
  description: string; // e.g. "اولین وظیفه" - used as main title for toast
  icon_name: string; // e.g. "Trophy"
  reward_points: number;
  category: string;
  rarity: string;
  created_at: string;
  required_tasks_completed?: number | null;
  required_streak_days?: number | null;
  required_level?: number | null;
  unlock_condition_type?: string | null;
}

// Helper for rarity colors
const getRarityStyles = (rarity: string) => {
  switch (rarity) {
    case 'rare': return { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', textColor: '#3b82f6' }; // blue-500
    case 'epic': return { borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)', textColor: '#a855f7' }; // purple-500
    case 'legendary': return { borderColor: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.1)', textColor: '#eab308' }; // yellow-500
    default: return { borderColor: '#6b7280', backgroundColor: 'rgba(107, 114, 128, 0.1)', textColor: '#6b7280' }; // gray-500
  }
};

// Icon mapping
const iconMap: Record<string, LucideIcon | ComponentType<any>> = {
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
  Sparkles,
  Star,
  Brain,
  FolderOpen,
  Users,
  // Add other icons as they are defined in achievements.icon_name
  default: Trophy, // Fallback icon
};

const getIconComponent = (iconName: string): LucideIcon | ComponentType<any> => {
  const normalizedIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1); // Capitalize first letter
  return iconMap[normalizedIconName] || iconMap.default;
};


export function showAuraAwardToast(points: number, reason: string) {
  toast.custom((t) => (
    <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl rounded-lg flex items-center gap-4 border border-purple-700">
      <Sparkles className="w-7 h-7 text-yellow-300 flex-shrink-0" />
      <div className="flex-grow">
        <p className="font-bold text-lg">+{points} آئورا!</p>
        <p className="text-sm opacity-90">{reason}</p>
      </div>
      <button
        onClick={() => toast.dismiss(t)}
        className="ml-auto p-1 rounded-full hover:bg-white/20 transition-colors text-sm"
        aria-label="بستن"
      >
        ✕
      </button>
    </div>
  ), { duration: 3000 });
}

export function showLevelUpToast(newLevel: number) {
  toast.custom((t) => (
    <div className="p-6 max-w-sm mx-auto bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl shadow-2xl text-center relative overflow-hidden">
      <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/20 rounded-full animate-pulse"></div>
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/20 rounded-full animate-pulse delay-75"></div>
      <div className="relative z-10">
        <div className="flex justify-center mb-3">
          <Crown className="w-16 h-16 text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" />
        </div>
        <h1 className="text-3xl font-bold mb-2">تبریک! سطح شما بالا رفت!</h1>
        <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 mb-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
          {newLevel}
        </div>
        <p className="text-md opacity-90">به رشد خود ادامه دهید!</p>
         <button
            onClick={() => toast.dismiss(t)}
            className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
          >
            ادامه
          </button>
      </div>
    </div>
  ), { duration: 6000, position: 'top-center' });
}

export function showAchievementUnlockedToast(achievement: Achievement) {
  const rarityStyles = getRarityStyles(achievement.rarity);
  const IconComponent = getIconComponent(achievement.icon_name);

  toast.custom((t) => (
    <div
      style={{
        borderColor: rarityStyles.borderColor,
        backgroundColor: rarityStyles.backgroundColor,
        boxShadow: `0 0 15px -3px ${rarityStyles.borderColor}`
      }}
      className="p-4 shadow-lg rounded-lg border-2 flex items-start gap-4 w-full max-w-md backdrop-blur-sm"
    >
      <div className={`p-3 rounded-lg text-white flex-shrink-0`} style={{ backgroundColor: rarityStyles.borderColor, boxShadow: `0 0 10px ${rarityStyles.borderColor}` }}>
        <IconComponent className="w-8 h-8" />
      </div>
      <div className="flex-grow">
        <h3 className="font-bold text-md" style={{color: rarityStyles.textColor}}>{achievement.description}</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{achievement.name}</p>
        <p className="text-sm font-semibold text-green-500 mb-2">+{achievement.reward_points} امتیاز آئورا</p>
        <span
          className={`text-xs px-3 py-1 rounded-full border font-medium`}
          style={{ borderColor: rarityStyles.borderColor, color: rarityStyles.textColor, backgroundColor: rarityStyles.backgroundColor }}
        >
          {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
        </span>
      </div>
      <button
        onClick={() => toast.dismiss(t)}
        className="ml-auto p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-sm flex-shrink-0"
        aria-label="بستن"
      >
        ✕
      </button>
    </div>
  ), { duration: 7000 });
}
