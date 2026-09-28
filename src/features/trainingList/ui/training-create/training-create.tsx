import { FC, useEffect, useState } from "react";

import {
  XIcon,
  PlusIcon,
  TrashIcon,
  CopyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  LayersIcon,
} from "lucide-react";

import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import { useChangeTraining } from "@/entities/training/use-training-change";
import { useCreateTraining } from "@/entities/training/use-training-create";
import { cn } from "@/shared/lib/css";
import { useListKeys } from "@/shared/lib/useListKeys";
import { useOpen } from "@/shared/lib/useOpen";
import { ApiSchemas } from "@/shared/schema";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { ExerciseSelectModal } from "@/shared/ui/kit/exercise-select-modal";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { Switch } from "@/shared/ui/kit/switch";
import { Textarea } from "@/shared/ui/kit/Textarea";

import styles from "./training-create.module.scss";

type TrainingCreateProps = {
  close: () => void;
  training?: ApiSchemas["Training"];
};

type ExerciseForm = ApiSchemas["ExerciseType"];

const UNSELECTED_EXERCISE_ID = "";

export const TrainingCreate: FC<TrainingCreateProps> = ({
  close,
  training,
}) => {
  const { exercises: exercisesList, isPending: isLoading } =
    useExercisesFetchList({});
  const { create, isPending } = useCreateTraining();
  const { change, isPending: isChangePending } = useChangeTraining();

  const { close: closeModal, isOpen, open } = useOpen();
  const [exerciseModalIndex, setExerciseModalIndex] = useState<number | null>(
    null,
  );

  const [form, setForm] = useState<ApiSchemas["TrainingCreateBody"]>({
    name: "",
    description: "",
    favorite: false,
    exerciseTypes: [],
  });
  const exerciseKeys = useListKeys(form.exerciseTypes.length);

  const handleFormChange = (
    field: string,
    value: string | boolean | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleExerciseChange = (
    index: number,
    field: keyof ExerciseForm,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      exerciseTypes: prev.exerciseTypes.map((exercise, i) =>
        i === index ? { ...exercise, [field]: value } : exercise,
      ),
    }));
  };

  const getExerciseById = (exerciseId: string) => {
    return exercisesList.find((ex) => ex.id === exerciseId);
  };

  const handleExerciseSelect = (index: number, exerciseId: string) => {
    const selectedExercise = exercisesList.find((ex) => ex.id === exerciseId);
    if (selectedExercise) {
      handleExerciseChange(index, "id", selectedExercise.id);
    }
  };

  const openExerciseModalForIndex = (index: number) => {
    setExerciseModalIndex(index);
    open();
  };

  const closeExerciseModal = () => {
    setExerciseModalIndex(null);
    closeModal();
  };

  const addExercise = () => {
    setForm((prev) => ({
      ...prev,
      exerciseTypes: [
        ...prev.exerciseTypes,
        {
          id: UNSELECTED_EXERCISE_ID,
        },
      ],
    }));
  };

  const removeExercise = (index: number) => {
    if (form.exerciseTypes.length > 1) {
      exerciseKeys.remove(index);
      setForm((prev) => ({
        ...prev,
        exerciseTypes: prev.exerciseTypes.filter((_, i) => i !== index),
      }));
    }
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < form.exerciseTypes.length) {
      exerciseKeys.move(index, newIndex);
      const newExercises = [...form.exerciseTypes];
      [newExercises[index], newExercises[newIndex]] = [
        newExercises[newIndex],
        newExercises[index],
      ];
      setForm((prev) => ({ ...prev, exerciseTypes: newExercises }));
    }
  };

  const duplicateExercise = (index: number) => {
    const exerciseToDuplicate = form.exerciseTypes[index];
    setForm((prev) => ({
      ...prev,
      exerciseTypes: [
        ...prev.exerciseTypes,
        {
          ...exerciseToDuplicate,
        },
      ],
    }));
  };

  const validateForm = () => {
    if (
      form.exerciseTypes.length === 0 ||
      form.exerciseTypes.some((ex) => ex.id === UNSELECTED_EXERCISE_ID)
    ) {
      alert(
        "Пожалуйста, заполните название тренировки и выберите упражнение в каждой строке",
      );
      return false;
    }
    return true;
  };

  const createTraining = async () => {
    if (!form.name || isPending) return;
    if (!validateForm()) return;
    try {
      await create(form);
      close();
    } catch (error) {
      console.error("Не удалось создать тренировку", error);
      alert("Не удалось создать тренировку. Попробуйте ещё раз.");
    }
  };

  const changeTraining = async () => {
    if (!form.name || isChangePending || !training) return;
    if (!validateForm()) return;
    try {
      await change({ id: training.id, ...form });
      close();
    } catch (error) {
      console.error("Не удалось сохранить тренировку", error);
      alert("Не удалось сохранить тренировку. Попробуйте ещё раз.");
    }
  };

  useEffect(() => {
    if (training) {
      exerciseKeys.reset();
      setForm(training);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [training]);

  return (
    <div className={styles.modalOverlay}>
      <Card className={styles.modalCard}>
        <CardHeader className={styles.cardHeader}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className={styles.cardTitle}>
              Создание новой тренировки
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={close}
              className={styles.closeButton}
            >
              <XIcon className={styles.closeIcon} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className={styles.cardContent}>
          <div className={styles.contentWrapper}>
            {/* Основная информация */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Основная информация</h3>

              <div className={styles.formGroup}>
                <Label
                  htmlFor="name"
                  className="mb-2 block text-sm sm:text-base text-foreground"
                >
                  Название тренировки *
                </Label>
                <Input
                  id="name"
                  placeholder="Например: Силовая тренировка на грудь"
                  value={form.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  className={styles.input}
                />
              </div>
              <div>
                <Label
                  htmlFor="description"
                  className="mb-2 block text-sm sm:text-base text-foreground"
                >
                  Описание тренировки
                </Label>
                <Textarea
                  id="description"
                  placeholder="Опишите цели, особенности, рекомендации..."
                  value={form.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  className={styles.textarea}
                  rows={2}
                />
              </div>
            </div>

            {/* Упражнения */}
            <div className={styles.section}>
              <div className={styles.exercisesHeader}>
                <h3 className={styles.sectionTitle}>
                  <LayersIcon className={styles.exercisesIcon} />
                  Упражнения в тренировке ({form.exerciseTypes.length})
                </h3>
                <Button
                  onClick={addExercise}
                  size="sm"
                  className={styles.addExerciseButton}
                >
                  <PlusIcon className={styles.addIcon} />
                  Добавить упражнение
                </Button>
              </div>

              <div className={styles.exercisesList}>
                {form.exerciseTypes.map((exercise, index) => (
                  <Card
                    key={exerciseKeys.keys[index]}
                    className={styles.exerciseCard}
                  >
                    <CardContent className={styles.exerciseCardContent}>
                      <div className={styles.exerciseHeader}>
                        <div className={styles.exerciseInfo}>
                          <div className={styles.exerciseNumberContainer}>
                            <span className={styles.exerciseNumber}>
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            {getExerciseById(exercise.id)?.name ? (
                              <div className={styles.exerciseName}>
                                {getExerciseById(exercise.id)?.name}
                              </div>
                            ) : (
                              <div className={styles.exerciseName}>
                                Упражнение не выбрано
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={styles.exerciseActions}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveExercise(index, "up")}
                            disabled={index === 0}
                            className={styles.actionButton}
                          >
                            <ArrowUpIcon className={styles.actionIcon} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveExercise(index, "down")}
                            disabled={index === form.exerciseTypes.length - 1}
                            className={styles.actionButton}
                          >
                            <ArrowDownIcon className={styles.actionIcon} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => duplicateExercise(index)}
                            className={styles.actionButton}
                          >
                            <CopyIcon className={styles.actionIcon} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeExercise(index)}
                            disabled={form.exerciseTypes.length <= 1}
                            className={cn(
                              styles.actionButton,
                              "text-red-500 hover:text-red-600 hover:bg-red-50",
                            )}
                          >
                            <TrashIcon className={styles.actionIcon} />
                          </Button>
                        </div>
                      </div>

                      <div className={styles.exerciseForm}>
                        {/* Выбор упражнения */}
                        <div>
                          <Label className="mb-2 block text-sm sm:text-base text-foreground">
                            Выбрать упражнение
                          </Label>
                          {isLoading ? (
                            <div className="h-12 bg-gray-100 rounded animate-pulse" />
                          ) : (
                            <Button
                              onClick={() => openExerciseModalForIndex(index)}
                              variant="outline"
                              className={styles.input}
                            >
                              {getExerciseById(exercise.id)?.name ||
                                "Выбрать упражнение"}
                            </Button>
                          )}
                        </div>
                        {/* Примечания к упражнению */}
                        <div>
                          <Label className="mb-2 block text-sm sm:text-base text-foreground">
                            Описание упражнения
                          </Label>
                          <Textarea
                            value={
                              getExerciseById(exercise.id)?.description ||
                              "Нет описания"
                            }
                            readOnly={true}
                            className={`h-16 text-sm ${styles.readonlyTextarea}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <ExerciseSelectModal
                exercises={exercisesList}
                onSelect={(exerciseId) => {
                  if (exerciseModalIndex === null) return;
                  handleExerciseSelect(exerciseModalIndex, exerciseId);
                }}
                close={closeExerciseModal}
                isOpen={isOpen}
                isLoading={isLoading}
              />
              <div className="mt-6">
                <div
                  className="add-exercise-dashed flex items-center justify-center gap-3 cursor-pointer"
                  onClick={addExercise}
                >
                  <PlusIcon className="h-6 w-6" />
                  <span className="font-medium">Добавить ещё упражнение</span>
                </div>
              </div>
            </div>

            {/* Дополнительные настройки */}
            <div className={styles.section}>
              <div className={styles.switchContainer}>
                <div>
                  <Label
                    htmlFor="favorite"
                    className={`${styles.switchLabel} text-sm sm:text-base text-foreground`}
                  >
                    Добавить в избранное
                  </Label>
                  <p
                    className={`${styles.switchDescription} text-xs sm:text-sm text-muted-foreground`}
                  >
                    Тренировка появится в разделе "Избранное"
                  </p>
                </div>
                <Switch
                  id="favorite"
                  checked={form.favorite}
                  onCheckedChange={(checked) =>
                    handleFormChange("favorite", checked)
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>

        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerText}></div>

            <div className={styles.actions}>
              <Button
                variant="ghost"
                onClick={close}
                disabled={isPending}
                className="text-sm sm:text-base"
              >
                Отмена
              </Button>

              {!training ? (
                <Button
                  onClick={createTraining}
                  disabled={
                    !form.name || form.exerciseTypes.length === 0 || isPending
                  }
                  className={styles.createButton}
                >
                  {isPending ? (
                    <>
                      <div className={styles.spinner} />
                      Создание...
                    </>
                  ) : (
                    <>
                      <PlusIcon className={styles.createIcon} />
                      Создать тренировку
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={changeTraining} disabled={isChangePending}>
                  Сохранить
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
