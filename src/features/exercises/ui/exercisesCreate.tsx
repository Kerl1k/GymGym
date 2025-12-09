import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Input } from "@/shared/ui/kit/inputLogin";
import { Label } from "@/shared/ui/kit/label";

import { Textarea } from "@/shared/ui/kit/Textarea";
import { Badge } from "@/shared/ui/kit/badge";
import { XIcon, PlusIcon, InfoIcon } from "lucide-react";
import { FC, useState } from "react";
import { useCreateExercises } from "@/shared/api/thunks/use-create-exercises";
import { TogleAddFavorite } from "@/shared/ui/kit/togleAddFavorite";

type ExercisesCreateProps = {
  close: () => void;
};

export const ExercisesCreate: FC<ExercisesCreateProps> = ({ close }) => {
  const [form, setForm] = useState({
    name: "",
    type: "strength",
    description: "",
    difficulty: "medium",
    equipment: "",
    muscles: [] as string[],
    videoUrl: "",
    favorite: false,
  });

  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const { create, isPending } = useCreateExercises();

  const muscleGroups = [
    "Грудь",
    "Спина",
    "Плечи",
    "Бицепс",
    "Трицепс",
    "Ноги",
    "Квадрицепс",
    "Ягодицы",
    "Икры",
    "Пресс",
    "Трапеции",
    "Предплечья",
  ];

  const handleChange = (field: string, value: string | string[] | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle],
    );
    handleChange("muscles", selectedMuscles);
  };

  const addExercise = () => {
    if (!form.name || !form.type || isPending) return;

    create({
      name: form.name,
      favorite: form.favorite,
      muscleGroups: form.muscles,
      description: form.description,
      videoUrl: form.videoUrl,
    });

    close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              Создание нового упражнения
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={close}
              className="h-8 w-8 p-0"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <InfoIcon className="h-5 w-5" />
                Основная информация
              </h3>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="mb-2 block">
                    Название упражнения *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Например: Жим штанги лежа"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full h-12 text-lg"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Мышечные группы</Label>
                  <div className="flex flex-wrap gap-2">
                    {muscleGroups.map((muscle) => (
                      <Badge
                        key={muscle}
                        variant={
                          selectedMuscles.includes(muscle)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer transition-all hover:scale-105"
                        onClick={() => toggleMuscle(muscle)}
                      >
                        {muscle}
                        {selectedMuscles.includes(muscle) && (
                          <XIcon className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="mb-2 block">
                    Описание
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Опишите технику выполнения, советы, рекомендации..."
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    className="min-h-[100px] resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="videoUrl" className="mb-2 block">
                Ссылка на видео
              </Label>
              <div className="flex gap-2">
                <Input
                  id="videoUrl"
                  placeholder="https://youtube.com/..."
                  value={form.videoUrl}
                  onChange={(e) => handleChange("videoUrl", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <TogleAddFavorite
              favorite={form.favorite}
              handleChange={() => handleChange("favorite", !form.favorite)}
              discription="Добавляет упражнение в избранное"
            />
          </div>
        </CardContent>

        <div className="border-t p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Отмена
            </Button>

            <Button
              onClick={addExercise}
              disabled={!form.name || !form.type || isPending}
              className="gap-2"
            >
              {isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Создание...
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5" />
                  Создать упражнение
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
