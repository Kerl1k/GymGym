import { ApiSchemas } from "@/shared/schema";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { Card } from "@/shared/ui/kit/card";
import { Plus, Minus, X, Dumbbell, Repeat, Save } from "lucide-react";
import { FC, useState, useEffect, useRef } from "react";

type SetData = {
  id: number;
  weight: number | null;
  repeatCount: number | null;
};

type NotedWeightModalProps = {
  isOpen: boolean;
  currentExercise: ApiSchemas["ActiveTraining"]["exercises"][0];
  close: () => void;
  setTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveTraining"]>
  >;
  initialData?: SetData[] | SetData;
};

export const NotedWeightModal: FC<NotedWeightModalProps> = ({
  close,
  isOpen,
  currentExercise,
  setTraining,
  initialData,
}) => {
  const [sets, setSets] = useState<SetData[]>([
    { id: 0, weight: null, repeatCount: null },
  ]);
  const [isMultipleSets, setIsMultipleSets] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      if (Array.isArray(initialData)) {
        setSets(
          initialData.length > 0
            ? initialData
            : [{ id: 0, weight: null, repeatCount: null }],
        );
        setIsMultipleSets(true);
      } else {
        setSets([initialData]);
        setIsMultipleSets(false);
      }
    } else {
      setSets([{ id: 0, weight: null, repeatCount: null }]);
      setIsMultipleSets(true);
    }

    if (contentRef.current && isOpen) {
      contentRef.current.scrollTop = 0;
    }
  }, [initialData, isOpen]);

  const handleAddSet = () => {
    if (sets.length < 10) {
      setSets([...sets, { id: 0, weight: null, repeatCount: null }]);
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
    field: keyof SetData,
    value: string,
  ) => {
    const newSets = [...sets];
    const numValue = value === "" ? null : Number(value);
    newSets[index] = { ...newSets[index], [field]: numValue };
    setSets(newSets);
  };

  const handleIncrement = (index: number, field: keyof SetData) => {
    const newSets = [...sets];
    const currentValue = newSets[index][field] || 0;
    newSets[index] = { ...newSets[index], [field]: currentValue + 1 };
    setSets(newSets);
  };

  const handleDecrement = (index: number, field: keyof SetData) => {
    const newSets = [...sets];
    const currentValue = newSets[index][field] || 0;
    if (currentValue > 0) {
      newSets[index] = { ...newSets[index], [field]: currentValue - 1 };
      setSets(newSets);
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
        ? validSets.map((set, index) => ({
            id: set.id || index + 1,
            weight: set.weight || 0,
            repeatCount: set.repeatCount || 0,
          }))
        : [
            {
              id: validSets[0].id || 1,
              weight: validSets[0].weight || 0,
              repeatCount: validSets[0].repeatCount || 0,
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
          newSets.forEach((newSet) => {
            const existingSetIndex = updatedSets.findIndex(
              (s) => s.id === newSet.id,
            );
            if (existingSetIndex >= 0) {
              // Если сет с таким id уже существует, обновляем его
              updatedSets[existingSetIndex] = newSet;
            } else {
              // Если сета с таким id нет, добавляем новый
              updatedSets.push(newSet);
            }
          });

          return { ...ex, sets: updatedSets };
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
        <Card className="p-4 bg-gray-50 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{currentExercise.name}</h3>
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
            </div>
          </div>
        </Card>

        {/* Список сетов */}
        <div className="space-y-4">
          {sets.length > 1 && (
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Сеты</h4>
              {isMultipleSets && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {sets.length}/{10}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSet}
                    disabled={sets.length >= 10}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить сет
                  </Button>
                </div>
              )}
            </div>
          )}

          {sets.map((set, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-semibold text-blue-700">
                      {index + 1}
                    </span>
                  </div>
                  <span className="font-medium">Сет {index + 1}</span>
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

              <div className="grid grid-cols-2 gap-4">
                {/* Вес */}
                <div className="space-y-2">
                  <Label
                    htmlFor={`weight-${index}`}
                    className="flex items-center gap-2"
                  >
                    <Dumbbell className="w-4 h-4" />
                    Вес (кг)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecrement(index, "weight")}
                      className="w-10 h-10"
                    >
                      <Minus className="w-4 h-4" />
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
                      className="text-center"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleIncrement(index, "weight")}
                      className="w-10 h-10"
                    >
                      <Plus className="w-4 h-4" />
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
                        className={`px-2 py-1 text-xs rounded ${set.weight === weight ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
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
                    className="flex items-center gap-2"
                  >
                    <Repeat className="w-4 h-4" />
                    Повторения
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecrement(index, "repeatCount")}
                      className="w-10 h-10"
                    >
                      <Minus className="w-4 h-4" />
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
                      className="text-center"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleIncrement(index, "repeatCount")}
                      className="w-10 h-10"
                    >
                      <Plus className="w-4 h-4" />
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
                          className={`px-2 py-1 text-xs rounded ${set.repeatCount === reps ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
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
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500">Сеты</div>
              <div className="text-xl font-bold">{sets.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Повторения</div>
              <div className="text-xl font-bold">
                {sets.reduce((total, set) => total + (set.repeatCount || 0), 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Общий объем</div>
              <div className="text-xl font-bold">
                {totalVolume.toFixed(1)} кг
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Кнопки действий (фиксированные внизу) */}
      <div className="sticky bottom bg-white pt-4 border-t">
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={close}>
            Отмена
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Очистить все поля
                setSets([{ id: 0, weight: null, repeatCount: null }]);
              }}
            >
              Очистить
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2"
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
