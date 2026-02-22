import {
  Heart,
  Activity,
  Target,
  Zap,
  BicepsFlexed,
  Dumbbell,
} from "lucide-react";

/**
 * All available muscle groups
 */
export const MUSCLE_GROUPS = [
  "Грудь",
  "Спина",
  "Плечи",
  "Бицепс",
  "Трицепс",
  "Пресс",
  "Ноги",
  "Ягодицы",
  "Икры",
  "Бицепс бедра",
  "Трапеции",
  "Предплечья",
] as const;

/**
 * Muscle group colors for UI display
 */
export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Грудь: "bg-red-500/20 text-red-600 border border-red-500/30",
  Спина: "bg-green-500/20 text-green-600 border border-green-500/30",
  Плечи: "bg-blue-500/20 text-blue-600 border border-blue-500/30",
  Бицепс: "bg-purple-500/20 text-purple-600 border border-purple-500/30",
  Трицепс: "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30",
  Пресс: "bg-orange-500/20 text-orange-600 border border-orange-500/30",
  Ноги: "bg-indigo-500/20 text-indigo-600 border border-indigo-500/30",
  Ягодицы: "bg-pink-500/20 text-pink-600 border border-pink-500/30",
  Икры: "bg-teal-500/20 text-teal-600 border border-teal-500/30",
  "Бицепс бедра": "bg-lime-500/20 text-lime-600 border border-lime-500/30",
  Трапеции: "bg-cyan-500/20 text-cyan-600 border border-cyan-500/30",
  Предплечья: "bg-amber-500/20 text-amber-600 border border-amber-500/30",
};

/**
 * Muscle group icons for UI display
 */
export const MUSCLE_GROUP_ICONS: Record<string, React.ReactNode> = {
  Грудь: <Heart />,
  Спина: <BicepsFlexed />,
  Плечи: <Target />,
  Бицепс: <BicepsFlexed />,
  Трицепс: <BicepsFlexed />,
  Пресс: <Zap />,
  Ноги: <Activity />,
  Ягодицы: <Activity />,
  Икры: <Activity />,
  "Бицепс бедра": <BicepsFlexed />,
  Трапеции: <Target />,
  Предплечья: <BicepsFlexed />,
};

/**
 * Gets the muscle group color class for a given muscle group
 * @param group - The muscle group name
 * @returns The color class string
 */
export function getMuscleGroupColor(group: string): string {
  return (
    MUSCLE_GROUP_COLORS[group] ||
    "bg-muted text-muted-foreground border border-border"
  );
}

/**
 * Gets the muscle group icon for a given muscle group
 * @param group - The muscle group name
 * @returns The React node for the icon
 */
export function getMuscleGroupIcon(group: string): React.ReactNode {
  return MUSCLE_GROUP_ICONS[group] || <Dumbbell />;
}
