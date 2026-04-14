import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";

import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { createPortal } from "react-dom";

import { useCreateExercises } from "@/entities/exercises/use-create-exercises";
import { useChangeExercises } from "@/entities/exercises/use-exercises-change";
import { ApiSchemas } from "@/shared/schema";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { TogleAddFavorite } from "@/shared/ui/kit/togleAddFavorite";

type ExercisesCreateProps = {
  close: () => void;
  exercises?: ApiSchemas["ExerciseType"];
};

/** Подсказки для поля «единица измерения» (можно ввести любой текст). */
const GYM_UNIT_PRESETS = [
  "кг",
  "lb",
  "раз",
  "подход",
  "сек",
  "мин",
  "м",
  "см",
  "RPE",
  "% от 1ПМ",
  // Частые варианты ввода/алиасы
  "кг.",
  "сек.",
  "мин.",
  "повт",
  "повторения",
  "kg",
  "reps",
  "sets",
  "%",
] as const;

type UnitRow = { id: string; value: string };

function newUnitRow(value = ""): UnitRow {
  return { id: crypto.randomUUID(), value };
}

function defaultUnitRows(): UnitRow[] {
  return [newUnitRow("кг"), newUnitRow("раз")];
}

function normalizeUnits(rows: UnitRow[]) {
  return rows.map((r) => r.value.trim()).filter(Boolean);
}

type GymUnitComboProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function GymUnitCombo({ value, onChange, placeholder }: GymUnitComboProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const q = value.trim().toLowerCase();
  const filtered = q
    ? GYM_UNIT_PRESETS.filter((u) => u.toLowerCase().includes(q))
    : [...GYM_UNIT_PRESETS];

  const syncMenuPosition = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const next = {
      top: r.bottom + 4,
      left: r.left,
      width: r.width,
    };
    setMenuBox((prev) =>
      prev &&
      prev.top === next.top &&
      prev.left === next.left &&
      prev.width === next.width
        ? prev
        : next,
    );
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuBox(null);
      return;
    }
    syncMenuPosition();
    const onMove = () => syncMenuPosition();
    window.addEventListener("resize", onMove);
    const anchor = anchorRef.current;
    const scrollParent = anchor?.closest('[data-slot="card-content"]') as
      | HTMLElement
      | null
      | undefined;
    scrollParent?.addEventListener("scroll", onMove, { passive: true });
    return () => {
      window.removeEventListener("resize", onMove);
      scrollParent?.removeEventListener("scroll", onMove);
    };
  }, [open, value]);

  const list =
    open && filtered.length > 0 && menuBox ? (
      <ul
        role="listbox"
        style={{
          position: "fixed",
          top: menuBox.top,
          left: menuBox.left,
          width: menuBox.width,
          zIndex: 100,
        }}
        className="max-h-48 overflow-auto rounded-md border border-input bg-popover text-popover-foreground shadow-md"
      >
        {filtered.map((u) => (
          <li key={u}>
            <button
              type="button"
              className="hover:bg-accent w-full px-3 py-2 text-left text-sm"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(u);
                setOpen(false);
              }}
            >
              {u}
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div ref={anchorRef} className="relative w-full min-w-0">
      <Input
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        className="h-11 w-full min-w-0"
      />
      {list ? createPortal(list, document.body) : null}
    </div>
  );
}

export const ExercisesCreate: FC<ExercisesCreateProps> = ({
  close,
  exercises,
}) => {
  const [form, setForm] = useState<ApiSchemas["ExerciseTypeCreateBody"]>({
    name: "",
    muscleGroups: ["strength"],
    description: "",
    favorite: false,
    restTime: 60,
  });

  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [unitRows, setUnitRows] = useState<UnitRow[]>(() => defaultUnitRows());
  const { create, isPending } = useCreateExercises();
  const { change } = useChangeExercises();

  const muscleGroups = [
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
  };

  const addExercise = () => {
    if (!form.name || isPending) return;

    create({
      ...form,
      muscleGroups: selectedMuscles,
      units: normalizeUnits(unitRows),
    });

    close();
  };

  const changeExercises = () => {
    if (!form.name || isPending || !exercises) return;
    change({
      ...form,
      id: exercises.id,
      muscleGroups: selectedMuscles,
      units: normalizeUnits(unitRows),
    });
    close();
  };

  useEffect(() => {
    if (exercises) {
      setForm(exercises);
      setSelectedMuscles(exercises.muscleGroups);
      const fromApi = exercises.units?.filter((u) => u.trim());
      setUnitRows(
        fromApi?.length ? fromApi.map((u) => newUnitRow(u)) : defaultUnitRows(),
      );
    } else {
      setUnitRows(defaultUnitRows());
    }
  }, [exercises]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="flex min-h-0 w-full max-w-2xl max-h-[90vh] flex-col gap-0 overflow-hidden pb-0">
        <CardHeader className="shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Создание упражнения</CardTitle>
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

        <CardContent className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-6 py-4">
            <div className="space-y-4">
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
                  <Label className="mb-2 block">Единицы измерения</Label>
                  <p className="text-muted-foreground text-sm mb-2">
                    Выберите из списка или введите свою; можно указать несколько
                    значений.
                  </p>
                  <div className="space-y-2">
                    {unitRows.map((row, index) => (
                      <div key={row.id} className="flex gap-2 items-center">
                        <div className="min-w-0 flex-1">
                          <GymUnitCombo
                            placeholder="Например: кг"
                            value={row.value}
                            onChange={(v) =>
                              setUnitRows((prev) =>
                                prev.map((r, i) =>
                                  i === index ? { ...r, value: v } : r,
                                ),
                              )
                            }
                          />
                        </div>
                        {unitRows.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0"
                            onClick={() =>
                              setUnitRows((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                            aria-label="Удалить единицу"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() =>
                        setUnitRows((prev) => [...prev, newUnitRow()])
                      }
                    >
                      <PlusIcon className="h-4 w-4" />
                      Добавить единицу
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <TogleAddFavorite
              favorite={form.favorite || false}
              handleChange={() => handleChange("favorite", !form.favorite)}
              discription="Добавляет упражнение в избранное"
            />
          </div>
        </CardContent>

        <div className="shrink-0 border-t p-6 bg-muted">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Отмена
            </Button>

            {!exercises ? (
              <Button
                onClick={addExercise}
                disabled={!form.name || isPending}
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
            ) : (
              <Button
                onClick={changeExercises}
                disabled={!form.name || isPending}
                className="gap-2"
              >
                {" "}
                Сохранить изменения
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
