import { Modal } from "@/shared/ui/kit/modalWindow/modal";
import { FC } from "react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/shared/ui/kit/card";
import { Label } from "@/shared/ui/kit/label";
import { Textarea } from "@/shared/ui/kit/Textarea";
import { Switch } from "@/shared/ui/kit/switch";
import { Badge } from "@/shared/ui/kit/badge";
import styles from "./training-start.module.scss";
import Approach from "./approach";
import { ApiSchemas } from "@/shared/schema";

type ChangeModalProps = {
  close: () => void;
  isOpen: boolean;
  currentExercise: ApiSchemas["ActiveTraining"]["exercises"][0];
};

export const ChangeModal: FC<ChangeModalProps> = ({
  close,
  isOpen,
  currentExercise,
}) => {
  const [activeTraining, setActiveTraining] = useState<
    ApiSchemas["ActiveTraining"]["exercises"][0] | null
  >(null);

  const toggleCustomSets = () => {
    if (!activeTraining) return;

    setActiveTraining({
      ...activeTraining,
      useCustomSets: !activeTraining.useCustomSets,
    });
  };

  const updateExerciseNotes = (notes: string) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      return {
        ...currentExercise,
        notes,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  useEffect(() => {
    if (currentExercise) {
      setActiveTraining(currentExercise);
    }
  }, [currentExercise]);

  if (!activeTraining) {
    return <div className={styles.loading}>Загрузка тренировки...</div>;
  }

  return (
    <Modal close={close} isOpen={isOpen}>
      <div className={styles.container}>
        {/* Упражнения */}
        <div className={styles.exercisesList}>
          <Card key={currentExercise.id} className={styles.exerciseCard}>
            <CardContent className={styles.exerciseContent}>
              {/* Заголовок упражнения */}
              <div className={styles.exerciseTitle}>
                <div>
                  <h3 className={styles.exerciseName}>
                    {currentExercise.name}
                  </h3>
                  <div className={styles.exerciseTags}>
                    {currentExercise.muscleGroups
                      .slice(0, 3)
                      .map((group, i) => (
                        <Badge key={i} variant="outline" className={styles.tag}>
                          {group}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>

              {/* Переключатель разных весов */}
              <div className={styles.customSetsToggle}>
                <div className={styles.toggleContainer}>
                  <Label htmlFor={`custom-0`} className={styles.toggleLabel}>
                    Разные веса/повторения для подходов
                  </Label>
                  <Switch
                    id={`custom-0`}
                    checked={activeTraining.useCustomSets}
                    onCheckedChange={() => toggleCustomSets()}
                  />
                </div>
                <p className={styles.toggleDescription}>
                  {currentExercise.useCustomSets
                    ? "Каждый подход настраивается отдельно"
                    : "Все подходы с одинаковыми параметрами"}
                </p>
              </div>
              <Approach
                activeTraining={activeTraining}
                setActiveTraining={setActiveTraining}
              />
              <div className={styles.exerciseNotes}>
                <Label className={styles.notesLabel}>
                  Заметки к упражнению
                </Label>
                <Textarea
                  value={currentExercise.description}
                  onChange={(e) => updateExerciseNotes(e.target.value)}
                  placeholder="Заметки по технике, ощущения..."
                  className={styles.notesTextarea}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Modal>
  );
};
