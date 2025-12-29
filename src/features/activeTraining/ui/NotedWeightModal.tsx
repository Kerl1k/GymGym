import { ApiSchemas } from "@/shared/schema";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { Card } from "@/shared/ui/kit/card";
import { Plus, Minus, X, Dumbbell, Repeat, Save, Clock } from "lucide-react";
import { FC, useState, useEffect, useRef } from "react";

type NotedWeightModalProps = {
  isOpen: boolean;
  currentExercise: ApiSchemas["ActiveTraining"]["exercises"][0];
  close: () => void;
  setTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveTraining"]>
  >;
  initialData?:
    | ApiSchemas["ActiveTraining"]["exercises"][0]["sets"]
    | ApiSchemas["ActiveTraining"]["exercises"][0]["sets"][number];
};

export const NotedWeightModal: FC<NotedWeightModalProps> = ({
  close,
  isOpen,
  currentExercise,
  setTraining,
  initialData,
}) => {
  const [sets, setSets] = useState<
    ApiSchemas["ActiveTraining"]["exercises"][0]["sets"]
  >([{ weight: 0, repeatCount: 0, done: false }]);
  const [isMultipleSets, setIsMultipleSets] = useState(true);
  const [restTime, setRestTime] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      if (Array.isArray(initialData)) {
        setSets(
          initialData.length > 0
            ? initialData
            : [{ weight: 0, repeatCount: 0, done: false }],
        );
        setIsMultipleSets(true);
      } else {
        setSets([initialData]);
        setIsMultipleSets(false);
      }
    } else {
      setSets([{ weight: 0, repeatCount: 0, done: false }]);
      setIsMultipleSets(true);
    }

    // Initialize restTime from currentExercise if no initialData
    if (!initialData) {
      setRestTime(currentExercise.restTime || 90);
    } else {
      setRestTime(currentExercise.restTime || null);
    }

    if (contentRef.current && isOpen) {
      contentRef.current.scrollTop = 0;
    }
  }, [initialData, isOpen, currentExercise.restTime]);

  const handleAddSet = () => {
    if (sets.length < 10) {
      setSets([...sets, { weight: 0, repeatCount: 0, done: false }]);
    }
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length > 1) {
      const newSets = sets.filter((_, i) => i !== index);
      setSets(newSets);
    }
  };

  const handleSetChange = (
    index: number,
    field: keyof ApiSchemas["ActiveTraining"]["exercises"][0]["sets"][number],
    value: string,
  ) => {
    const newSets = [...sets];
    const numValue = value === "" ? null : Number(value);
    newSets[index] = { ...newSets[index], [field]: numValue };
    setSets(newSets);
  };

  const handleIncrement = (
    index: number,
    field: keyof Pick<
      ApiSchemas["ActiveTraining"]["exercises"][0]["sets"][number],
      "repeatCount" | "weight"
    >,
  ) => {
    const newSets = [...sets];
    const currentValue = newSets[index][field] || 0;
    newSets[index] = { ...newSets[index], [field]: currentValue + 1 };
    setSets(newSets);
  };

  const handleDecrement = (
    index: number,
    field: keyof Pick<
      ApiSchemas["ActiveTraining"]["exercises"][0]["sets"][number],
      "repeatCount" | "weight"
    >,
  ) => {
    const newSets = [...sets];
    const currentValue = newSets[index][field] || 0;
    if (currentValue > 0) {
      newSets[index] = { ...newSets[index], [field]: currentValue - 1 };
      setSets(newSets);
    }
  };

  const handleRestTimeChange = (value: string) => {
    const numValue = value === "" ? null : Number(value);
    setRestTime(numValue);
  };

  const handleRestTimeIncrement = () => {
    if (restTime !== null) {
      setRestTime(restTime + 5);
    } else {
      setRestTime(90);
    }
  };

  const handleRestTimeDecrement = () => {
    if (restTime !== null && restTime > 0) {
      setRestTime(restTime - 5);
    }
  };

  const handleSave = () => {
    const validSets = sets.filter(
      (set) => set.weight !== null && set.repeatCount !== null,
    );

    if (validSets.length === 0) {
      return;
    }

    // Преобразуем SetData в формат TrainingSet
    const newSets =
      isMultipleSets || validSets.length > 1
        ? validSets.map((set) => ({
            weight: set.weight || 0,
            repeatCount: set.repeatCount || 0,
            done: set.done || false,
          }))
        : [
            {
              weight: validSets[0].weight || 0,
              repeatCount: validSets[0].repeatCount || 0,
              done: validSets[0].done || false,
            },
          ];

    setTraining((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id === currentExercise.id) {
          // Для текущего упражнения заменяем только те сеты, которые были изменены
          // и сохраняем остальные существующие сеты
          const existingSets = ex.sets || [];
          const updatedSets = [...existingSets];

          // Обновляем или добавляем новые сеты
          newSets.forEach((newSet, index) => {
            const existingSetIndex = updatedSets.findIndex(
              (_, i) => i === index,
            );
            if (existingSetIndex >= 0) {
              // Если сет с таким id уже существует, обновляем его
              updatedSets[existingSetIndex] = newSet;
            } else {
              // Если сета с таким id нет, добавляем новый
              updatedSets.push(newSet);
            }
          });

          // Обновляем время отдыха если оно было изменено
          const updatedRestTime = restTime !== null ? restTime : ex.restTime;

          return { ...ex, sets: updatedSets, restTime: updatedRestTime };
        }
        return ex;
      }),
    }));
    close();
  };

  const totalVolume = sets.reduce((total, set) => {
    const weight = set.weight || 0;
    const reps = set.repeatCount || 0;
    return total + weight * reps;
  }, 0);

  const weightPresets = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
  const repPresets = [5, 8, 10, 12, 15, 20];
  const restTimePresets = [30, 45, 60, 75, 90, 120, 150, 180];

  return (
    <Modal
      close={close}
      isOpen={isOpen}
      title="Запись весов и повторений"
      className="max-h-[90vh]"
    >
      {/* Основной контент со скроллом */}
      <div
        ref={contentRef}
        className="space-y-6 overflow-y-auto pr-2"
        style={{
          maxHeight: "calc(90vh - 140px)", // Высота минус заголовок и кнопки
          scrollBehavior: "smooth",
        }}
      >
        {/* Информация об упражнении */}
        <Card className="p-3 sm:p-4 bg-muted sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base sm:text-lg">
                {currentExercise.name}
              </h3>
              {currentExercise.muscleGroups && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentExercise.muscleGroups.map((group, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Время отдыха:
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRestTimeDecrement}
                    className="w-8 h-8 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>

                  <Input
                    type="number"
                    min="0"
                    value={restTime === null ? "" : restTime}
                    onChange={(e) => handleRestTimeChange(e.target.value)}
                    placeholder="90"
                    className="w-16 text-center text-sm"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRestTimeIncrement}
                    className="w-8 h-8 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">сек</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {restTimePresets.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleRestTimeChange(time.toString())}
                    className={`px-2 py-1 text-xs rounded ${restTime === time ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80"}`}
                  >
                    {time}с
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Список сетов */}
        <div className="space-y-3 sm:space-y-4">
          {sets.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="font-medium text-sm sm:text-base">Сеты</h4>
              {isMultipleSets && (
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {sets.length}/{10}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSet}
                    disabled={sets.length >= 10}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить сет
                  </Button>
                </div>
              )}
            </div>
          )}

          {sets.map((set, index) => (
            <Card key={index} className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-semibold text-primary text-sm sm:text-base">
                      {index + 1}
                    </span>
                  </div>
                  <span className="font-medium text-sm sm:text-base">
                    Сет {index + 1}
                  </span>
                </div>

                {isMultipleSets && sets.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSet(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Вес */}
                <div className="space-y-2">
                  <Label
                    htmlFor={`weight-${index}`}
                    className="flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Dumbbell className="w-4 h-4" />
                    Вес (кг)
                  </Label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecrement(index, "weight")}
                      className="w-8 sm:w-10 h-8 sm:h-10"
                    >
                      <Minus className="w-3 sm:w-4 h-3 sm:h-4" />
                    </Button>

                    <Input
                      id={`weight-${index}`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={set.weight === null ? "" : set.weight}
                      onChange={(e) =>
                        handleSetChange(index, "weight", e.target.value)
                      }
                      placeholder="0"
                      className="text-center text-sm sm:text-base"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleIncrement(index, "weight")}
                      className="w-8 sm:w-10 h-8 sm:h-10"
                    >
                      <Plus className="w-3 sm:w-4 h-3 sm:h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {weightPresets.slice(0, 8).map((weight) => (
                      <button
                        key={weight}
                        type="button"
                        onClick={() =>
                          handleSetChange(index, "weight", weight.toString())
                        }
                        className={`px-1 sm:px-2 py-1 text-xs rounded ${set.weight === weight ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80"}`}
                      >
                        {weight}кг
                      </button>
                    ))}
                  </div>
                </div>

                {/* Повторения */}
                <div className="space-y-2">
                  <Label
                    htmlFor={`reps-${index}`}
                    className="flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Repeat className="w-4 h-4" />
                    Повторения
                  </Label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecrement(index, "repeatCount")}
                      className="w-8 sm:w-10 h-8 sm:h-10"
                    >
                      <Minus className="w-3 sm:w-4 h-3 sm:h-4" />
                    </Button>

                    <Input
                      id={`reps-${index}`}
                      type="number"
                      min="0"
                      value={set.repeatCount === null ? "" : set.repeatCount}
                      onChange={(e) =>
                        handleSetChange(index, "repeatCount", e.target.value)
                      }
                      placeholder="0"
                      className="text-center text-sm sm:text-base"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleIncrement(index, "repeatCount")}
                      className="w-8 sm:w-10 h-8 sm:h-10"
                    >
                      <Plus className="w-3 sm:w-4 h-3 sm:h-4" />
                    </Button>
                  </div>

                  {/* Быстрый выбор повторений (только для первых 3 сетов) */}
                  {index < 3 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {repPresets.map((reps) => (
                        <button
                          key={reps}
                          type="button"
                          onClick={() =>
                            handleSetChange(
                              index,
                              "repeatCount",
                              reps.toString(),
                            )
                          }
                          className={`px-1 sm:px-2 py-1 text-xs rounded ${set.repeatCount === reps ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80"}`}
                        >
                          {reps} раз
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Статистика */}
        <Card className="p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Сеты
              </div>
              <div className="text-lg sm:text-xl font-bold">{sets.length}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Повторения
              </div>
              <div className="text-lg sm:text-xl font-bold">
                {sets.reduce((total, set) => total + (set.repeatCount || 0), 0)}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Общий объем
              </div>
              <div className="text-lg sm:text-xl font-bold">
                {totalVolume.toFixed(1)} кг
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Кнопки действий (фиксированные внизу) */}
      <div className="sticky bottom bg-card pt-3 sm:pt-4 border-t">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={close}
            className="text-sm sm:text-base w-full sm:w-auto"
          >
            Отмена
          </Button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Очистить все поля
                setSets([{ weight: 0, repeatCount: 0, done: false }]);
              }}
              className="text-sm sm:text-base flex-1 sm:flex-none"
            >
              Очистить
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 text-sm sm:text-base flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
