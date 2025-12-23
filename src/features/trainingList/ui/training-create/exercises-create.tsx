import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import { Textarea } from "@/shared/ui/kit/Textarea";
import {
  XIcon,
  PlusIcon,
  TrashIcon,
  CopyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  LayersIcon,
} from "lucide-react";
import { FC, useEffect, useState } from "react";
import { useCreateTraining } from "@/entities/training/use-training-create";
import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import styles from "./exercises-create.module.scss";
import { cn } from "@/shared/lib/css";
import { ApiSchemas } from "@/shared/schema";
import { useChangeTraining } from "@/entities/training/use-training-change";

type TrainingCreateProps = {
  close: () => void;
  training?: ApiSchemas["Training"];
};

type ExerciseForm = Pick<
  ApiSchemas["Training"]["exercises"][0],
  "id" | "name" | "notes" | "type"
>;

export const TrainingCreate: FC<TrainingCreateProps> = ({
  close,
  training,
}) => {
  const { exercises: exercisesList, isPending: isLoading } =
    useExercisesFetchList({});
  const { create, isPending } = useCreateTraining();
  const { change } = useChangeTraining();

  const [form, setForm] = useState<ApiSchemas["Training"]>({
    name: "",
    id: Date.now().toString(),
    exercises: [
      {
        id: "1",
        name: "",
        type: ["strength"],
        notes: "",
        exerciseId: "",
      },
    ],
  });

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
    value: string | boolean | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === index ? { ...exercise, [field]: value } : exercise,
      ),
    }));
  };

  const handleExerciseSelect = (index: number, exerciseId: string) => {
    const selectedExercise = exercisesList.find((ex) => ex.id === exerciseId);
    if (selectedExercise) {
      handleExerciseChange(index, "name", selectedExercise.name);
    }
  };

  const addExercise = () => {
    setForm((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: Date.now().toString(),
          exerciseId: "",
          name: "",
          type: ["strength"],
          notes: "",
        },
      ],
    }));
  };

  const removeExercise = (index: number) => {
    if (form.exercises.length > 1) {
      setForm((prev) => ({
        ...prev,
        exercises: prev.exercises.filter((_, i) => i !== index),
      }));
    }
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < form.exercises.length) {
      const newExercises = [...form.exercises];
      [newExercises[index], newExercises[newIndex]] = [
        newExercises[newIndex],
        newExercises[index],
      ];
      setForm((prev) => ({ ...prev, exercises: newExercises }));
    }
  };

  const duplicateExercise = (index: number) => {
    const exerciseToDuplicate = form.exercises[index];
    setForm((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          ...exerciseToDuplicate,
          id: Date.now().toString(),
        },
      ],
    }));
  };

  const createTraining = () => {
    if (!form.name || isPending) return;
    create(form);
    close();
  };

  const changeTraining = () => {
    if (!form.name || isPending) return;
    change(training!.id, form);
    close();
  };

  useEffect(() => {
    if (training) {
      setForm(training);
    }
  }, [training]);

  return (
    <div className={styles.modalOverlay}>
      <Card className={styles.modalCard}>
        <CardHeader className={styles.cardHeader}>
          <div className="flex items-center justify-between">
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
                <Label htmlFor="name" className="mb-2 block">
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
                <Label htmlFor="description" className="mb-2 block">
                  Описание тренировки
                </Label>
                <Textarea
                  id="description"
                  placeholder="Опишите цели, особенности, рекомендации..."
                  value={""}
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
                  Упражнения в тренировке ({form.exercises.length})
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
                {form.exercises.map((exercise, index) => (
                  <Card key={exercise.id} className={styles.exerciseCard}>
                    <CardContent className={styles.exerciseCardContent}>
                      <div className={styles.exerciseHeader}>
                        <div className={styles.exerciseInfo}>
                          <div className={styles.exerciseNumberContainer}>
                            <span className={styles.exerciseNumber}>
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <div className={styles.exerciseTitle}>
                              Упражнение {index + 1}
                            </div>
                            {exercise.name && (
                              <div className={styles.exerciseName}>
                                {exercise.name}
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
                            disabled={index === form.exercises.length - 1}
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
                            disabled={form.exercises.length <= 1}
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
                          <Label className="mb-2 block">Упражнение</Label>
                          {isLoading ? (
                            <div className="h-12 bg-gray-100 rounded animate-pulse" />
                          ) : (
                            <Select
                              defaultValue="empty"
                              value={exercise.name}
                              onValueChange={(value) =>
                                handleExerciseSelect(index, value)
                              }
                            >
                              <SelectTrigger className={styles.input}>
                                <SelectValue defaultValue={"empty"} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={exercise.name}>
                                  <div className="flex items-center justify-between">
                                    <span>{exercise.name}</span>
                                  </div>
                                </SelectItem>
                                {exercisesList.map((ex) => (
                                  <SelectItem key={ex.id} value={ex.id}>
                                    <div className="flex items-center justify-between">
                                      <span>{ex.name}</span>
                                    </div>
                                  </SelectItem>
                                )) || "Нет упражнений"}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        {/* Примечания к упражнению */}
                        <div>
                          <Label className="mb-2 block text-sm">
                            Примечания
                          </Label>
                          <Textarea
                            value={exercise.notes}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                "notes",
                                e.target.value,
                              )
                            }
                            readOnly={true}
                            className="h-16 text-sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Дополнительные настройки */}
            <div className={styles.section}>
              <div className={styles.switchContainer}>
                <div>
                  <Label htmlFor="favorite" className={styles.switchLabel}>
                    Добавить в избранное
                  </Label>
                  <p className={styles.switchDescription}>
                    Тренировка появится в разделе "Избранное"
                  </p>
                </div>
                {/* <Switch
                  id="favorite"
                  checked={form.favorite}
                  onCheckedChange={(checked) =>
                    handleFormChange("favorite", checked)
                  }
                /> */}
              </div>
            </div>
          </div>
        </CardContent>

        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerText}></div>

            <div className={styles.actions}>
              <Button variant="ghost" onClick={close} disabled={isPending}>
                Отмена
              </Button>

              {!training ? (
                <Button
                  onClick={createTraining}
                  disabled={!form.name || isPending}
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
                <Button onClick={changeTraining}>Сохранить</Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
