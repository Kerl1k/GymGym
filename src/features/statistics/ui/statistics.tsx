import { useMemo, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import { getWeightLike } from "@/shared/lib/active-training-units";
import { useFetchTrainingHistoryWithFilters } from "@/entities/training-history/use-training-history-with-filters";
import { Button } from "@/shared/ui/kit/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/kit/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";

type RangeKey = "7d" | "30d" | "90d" | "365d" | "all";

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; days?: number }> = [
  { key: "7d", label: "7 дней", days: 7 },
  { key: "30d", label: "30 дней", days: 30 },
  { key: "90d", label: "90 дней", days: 90 },
  { key: "365d", label: "Год", days: 365 },
  { key: "all", label: "Всё время" },
];

function safeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatDate(ts: number, variant: "short" | "long" = "short") {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  if (variant === "long") {
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
}

export const Statistics = () => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [range, setRange] = useState<RangeKey>("30d");

  const { exercises } = useExercisesFetchList({});
  const { history: filteredHistory, isPending } =
    useFetchTrainingHistoryWithFilters({
      sort: "dateStart",
      exerciseName: selectedExercise || "",
    });

  const rangeFromTs = useMemo(() => {
    const opt = RANGE_OPTIONS.find((o) => o.key === range);
    if (!opt?.days) return null;
    return Date.now() - opt.days * 24 * 60 * 60 * 1000;
  }, [range]);

  const historyInRange = useMemo(() => {
    if (!rangeFromTs) return filteredHistory;
    return filteredHistory.filter((t) => {
      const ts = new Date(t.dateStart).getTime();
      return Number.isFinite(ts) && ts >= rangeFromTs;
    });
  }, [filteredHistory, rangeFromTs]);

  const progressPoints = useMemo(() => {
    if (!selectedExercise) return [];

    return [...historyInRange]
      .map((training) => {
        const exercise = training.exercises.find(
          (ex) => ex.name === selectedExercise,
        );
        const ts = new Date(training.dateStart).getTime();
        if (!exercise?.sets?.length || !Number.isFinite(ts)) return null;

        const weights = exercise.sets
          .map((s) => safeNumber(getWeightLike(s)))
          .filter((v): v is number => v !== null);

        if (weights.length === 0) return null;

        const maxWeight = Math.max(...weights);
        const setsCount = weights.length;
        const volume = weights.reduce((acc, w) => acc + w, 0);

        return {
          dateTs: ts,
          maxWeight,
          setsCount,
          volume,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.dateTs - b.dateTs);
  }, [historyInRange, selectedExercise]);

  const summary = useMemo(() => {
    const trainingsCount = progressPoints.length;
    const totalSets = progressPoints.reduce((acc, p) => acc + p.setsCount, 0);
    const bestWeight =
      trainingsCount > 0 ? Math.max(...progressPoints.map((p) => p.maxWeight)) : 0;
    const lastWeight =
      trainingsCount > 0 ? progressPoints[trainingsCount - 1]!.maxWeight : 0;
    const firstWeight = trainingsCount > 0 ? progressPoints[0]!.maxWeight : 0;
    const delta = trainingsCount > 1 ? lastWeight - firstWeight : 0;

    return {
      trainingsCount,
      totalSets,
      bestWeight,
      lastWeight,
      delta,
    };
  }, [progressPoints]);

  const handleExerciseSelect = (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    setIsModalOpen(false);
  };

  return (
    <div className="w-full h-full p-4 md:p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 md:mb-6 gap-3">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Статистика
          </h1>
          <p className="text-sm text-muted-foreground">
            Выберите упражнение и период, чтобы увидеть прогресс.
          </p>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger size="sm" className="w-full sm:w-[160px]">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.key} value={o.key}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                {selectedExercise ? selectedExercise : "Выбрать упражнение"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Выберите упражнение</DialogTitle>
              </DialogHeader>
              <div className="max-h-72 overflow-y-auto border border-border rounded-md">
                {exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    className="w-full text-left p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                    onClick={() => handleExerciseSelect(exercise.name)}
                  >
                    {exercise.name}
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isPending ? (
        <div className="text-center py-10 text-muted-foreground">Загрузка...</div>
      ) : selectedExercise ? (
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Тренировки</CardDescription>
                <CardTitle className="text-2xl">{summary.trainingsCount}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                В выбранном периоде
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Подходы</CardDescription>
                <CardTitle className="text-2xl">{summary.totalSets}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Сумма по тренировкам
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Лучший вес</CardDescription>
                <CardTitle className="text-2xl">
                  {summary.bestWeight ? `${summary.bestWeight} кг` : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Максимум за тренировку
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Изменение</CardDescription>
                <CardTitle className="text-2xl">
                  {summary.trainingsCount > 1
                    ? `${summary.delta > 0 ? "+" : ""}${summary.delta} кг`
                    : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                От первой к последней точке
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle>График прогресса</CardTitle>
              <CardDescription>
                Точка = максимальный вес на тренировке
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 md:h-80 min-w-0">
                {progressPoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={progressPoints}
                      margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="dateTs"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        scale="time"
                        tickFormatter={(value: number) =>
                          formatDate(value, "short")
                        }
                        tickMargin={10}
                        minTickGap={24}
                      />
                      <YAxis
                        tickFormatter={(v: number) => `${v}`}
                        width={36}
                      />
                      <Tooltip
                        isAnimationActive={false}
                        cursor={{ stroke: "var(--border)" }}
                        labelFormatter={(label) =>
                          `Дата: ${formatDate(Number(label), "long")}`
                        }
                        formatter={(value) => [`${value} кг`, "Макс. вес"]}
                        wrapperStyle={{ outline: "none" }}
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 12,
                          padding: 12,
                          maxWidth: 280,
                          wordBreak: "break-word",
                        }}
                        itemStyle={{ padding: 0 }}
                        labelStyle={{ marginBottom: 6 }}
                        allowEscapeViewBox={{ x: false, y: true }}
                      />
                      <Line
                        type="monotone"
                        dataKey="maxWeight"
                        stroke="hsl(var(--primary))"
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                        strokeWidth={2.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Нет данных за выбранный период
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Начните со выбора упражнения</CardTitle>
            <CardDescription>
              После выбора появятся метрики и график прогресса.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Нажмите «Выбрать упражнение» сверху.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
