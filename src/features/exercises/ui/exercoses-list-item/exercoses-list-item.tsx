import { MoreHorizontal } from "lucide-react";

import { cn } from "@/shared/lib/css";
import { getMuscleGroupIcon, getMuscleGroupColor } from "@/shared/lib/utils";
import { ApiSchemas } from "@/shared/schema";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent } from "@/shared/ui/kit/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";

import styles from "./exercoses-list-item.module.scss";

interface ExercisesListItemProps {
  exercise: ApiSchemas["ExerciseType"];
  rightActions?: React.ReactNode;
  menuActions?: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
}

export function ExercisesListItem({
  exercise,
  rightActions,
  menuActions,
  onClick,
  isSelected = false,
}: ExercisesListItemProps) {
  const primaryMuscleGroup = exercise.muscleGroups[0] || "Общее";
  const muscleGroupIcon = getMuscleGroupIcon(primaryMuscleGroup);

  return (
    <Card
      className={cn(styles.exercisesListItem, isSelected && styles.selected)}
      onClick={onClick}
    >
      <CardContent className={styles.cardContent}>
        <div className={styles.contentWrapper}>
          <div className={cn(styles.muscleGroupBadge, styles.general)}>
            {muscleGroupIcon}
          </div>

          <div className={styles.mainContent}>
            <div className={styles.headerWrapper}>
              <div className={styles.titleWrapper}>
                <div className={styles.muscleGroupsContainer}>
                  {exercise.muscleGroups.map((group, index) => {
                    return (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={cn(
                          styles.muscleGroupBadgeSmall,
                          getMuscleGroupColor(group),
                        )}
                      >
                        {group}
                      </Badge>
                    );
                  })}
                </div>

                <p className="m-2">{exercise.name}</p>

                {exercise.units && exercise.units.length > 0 ? (
                  <div className={styles.unitsContainer}>
                    {exercise.units.map((unit, index) => (
                      <Badge
                        key={`${exercise.id}-unit-${index}-${unit}`}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "border-orange-200/90 bg-orange-50 font-medium text-orange-950",
                          "dark:border-orange-800/90 dark:bg-orange-950/45 dark:text-orange-100",
                        )}
                      >
                        {unit}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <div className={styles.description}>
                  {exercise.description && (
                    <div title={exercise.description}>
                      {exercise.description}
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
