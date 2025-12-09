import { Button } from "@/shared/ui/kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Badge } from "@/shared/ui/kit/badge";
import { Card, CardContent } from "@/shared/ui/kit/card";
import {
  MoreHorizontal,
  Play,
  Dumbbell,
  Heart,
  Activity,
  Target,
  Zap,
  BicepsFlexed,
} from "lucide-react";
import styles from "./exercoses-list-item.module.scss";
import { cn } from "@/shared/lib/css";

interface ExercisesListItemProps {
  exercise: {
    id: string;
    name: string;
    favorite: boolean;
    muscleGroups: string[];
    description?: string;
    videoUrl: string;
    createdAt?: string;
    updatedAt?: string;
  };
  rightActions?: React.ReactNode;
  menuActions?: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
}
const muscleGroupIcons: Record<string, React.ReactNode> = {
  Грудь: <Heart className={styles.muscleGroupIcon} />,
  Спина: <BicepsFlexed className={styles.muscleGroupIcon} />,
  Ноги: <Activity className={styles.muscleGroupIcon} />,
  Плечи: <Target className={styles.muscleGroupIcon} />,
  Бицепс: <BicepsFlexed className={styles.muscleGroupIcon} />,
  Трицепс: <BicepsFlexed className={styles.muscleGroupIcon} />,
  Пресс: <Zap className={styles.muscleGroupIcon} />,
  Ягодицы: <Activity className={styles.muscleGroupIcon} />,
};

const getMuscleGroupClass = (group: string): string => {
  const groupMap: Record<string, string> = {
    Грудь: styles.chest,
    Спина: styles.back,
    Ноги: styles.legs,
    Плечи: styles.shoulders,
    Бицепс: styles.biceps,
    Трицепс: styles.triceps,
    Пресс: styles.abs,
    Ягодицы: styles.glutes,
  };
  return groupMap[group] || styles.general;
};

export function ExercisesListItem({
  exercise,
  rightActions,
  menuActions,
  onClick,
  isSelected = false,
}: ExercisesListItemProps) {
  const primaryMuscleGroup = exercise.muscleGroups[0] || "Общее";
  const muscleGroupClass = getMuscleGroupClass(primaryMuscleGroup);
  const muscleGroupIcon = muscleGroupIcons[primaryMuscleGroup] || (
    <Dumbbell className={styles.muscleGroupIcon} />
  );

  return (
    <Card
      className={cn(styles.exercisesListItem, isSelected && styles.selected)}
      onClick={onClick}
    >
      <CardContent className={styles.cardContent}>
        <div className={styles.contentWrapper}>
          <div className={cn(styles.muscleGroupBadge, muscleGroupClass)}>
            {muscleGroupIcon}
          </div>

          <div className={styles.mainContent}>
            <div className={styles.headerWrapper}>
              <div className={styles.titleWrapper}>
                <div className={styles.muscleGroupsContainer}>
                  {exercise.muscleGroups.map((group, index) => {
                    const groupClass = getMuscleGroupClass(group);
                    return (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={cn(styles.muscleGroupBadgeSmall, groupClass)}
                      >
                        {group}
                      </Badge>
                    );
                  })}
                </div>

                {exercise.description && (
                  <p className={styles.description}>{exercise.description}</p>
                )}

                <div className={styles.infoContainer}>
                  {exercise.videoUrl && (
                    <div className={styles.videoInfo}>
                      <Play className={styles.videoIcon} />
                      <span>Есть видео</span>
                    </div>
                  )}

                  {exercise.createdAt && (
                    <div className={styles.dateInfo}>
                      Добавлено:{" "}
                      {new Date(exercise.createdAt).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.actionsWrapper}>
                {rightActions}
                {menuActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className={styles.menuButton}
                      >
                        <MoreHorizontal className={styles.menuIcon} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {menuActions}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// // Дополнительный компонент для компактного отображения
// export function ExercisesCompactItem({
//   exercise,
//   onClick,
// }: {
//   exercise: ExercisesListItemProps["exercise"];
//   onClick?: () => void;
// }) {
//   const primaryMuscleGroup = exercise.muscleGroups[0] || "Общее";
//   const muscleGroupClass = getMuscleGroupClass(primaryMuscleGroup);

//   return (
//     <div className={styles.compactItem} onClick={onClick}>
//       <div className={cn(styles.compactBadge, muscleGroupClass)}>
//         <Dumbbell className={styles.compactBadgeIcon} />
//       </div>
//       <div className={styles.compactContent}>
//         <div className={styles.compactTitleRow}>
//           <span className={styles.compactTitle}>{exercise.name}</span>
//           {exercise.favorite && <Star className={styles.compactFavoriteIcon} />}
//         </div>
//         <div className={styles.compactMuscleGroups}>
//           {exercise.muscleGroups.slice(0, 2).join(", ")}
//           {exercise.muscleGroups.length > 2 && "..."}
//         </div>
//       </div>
//     </div>
//   );
// }
