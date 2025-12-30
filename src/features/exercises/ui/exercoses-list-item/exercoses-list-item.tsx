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
  Dumbbell,
  Heart,
  Activity,
  Target,
  Zap,
  BicepsFlexed,
} from "lucide-react";
import styles from "./exercoses-list-item.module.scss";
import { cn } from "@/shared/lib/css";
import { ApiSchemas } from "@/shared/schema";

interface ExercisesListItemProps {
  exercise: ApiSchemas["ExerciseType"];
  rightActions?: React.ReactNode;
  menuActions?: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
}
const muscleGroupIcons: Record<string, React.ReactNode> = {
  Грудь: <Heart className={styles.muscleGroupIcon} />,
  Спина: <BicepsFlexed className={styles.muscleGroupIcon} />,
  Плечи: <Target className={styles.muscleGroupIcon} />,
  Бицепс: <BicepsFlexed className={styles.muscleGroupIcon} />,
  Трицепс: <BicepsFlexed className={styles.muscleGroupIcon} />,
  Пресс: <Zap className={styles.muscleGroupIcon} />,
  Ноги: <Activity className={styles.muscleGroupIcon} />,
  Ягодицы: <Activity className={styles.muscleGroupIcon} />,
  Икры: <Activity className={styles.muscleGroupIcon} />,
  "Бицепс бедра": <BicepsFlexed className={styles.muscleGroupIcon} />,
  Трапеции: <Target className={styles.muscleGroupIcon} />,
  Предплечья: <BicepsFlexed className={styles.muscleGroupIcon} />,
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

                <p className="m-2">{exercise.name}</p>

                <p className={styles.description}>
                  {exercise.description && (
                    <div title={exercise.description}>
                      {exercise.description}
                    </div>
                  )}
                </p>
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
