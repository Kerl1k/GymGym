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
  DialogDescription,
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
type MetricKey = "maxValue" | "avgValue" | "volume";

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; days?: number }> = [
  { key: "7d", label: "7 дней", days: 7 },
  { key: "30d", label: "30 дней", days: 30 },
  { key: "90d", label: "90 дней", days: 90 },
  { key: "365d", label: "Год", days: 365 },
  { key: "all", label: "Всё время" },
];

const METRIC_OPTIONS: Array<{ key: MetricKey; label: string; hint: string }> = [
  {
    key: "maxValue",
    label: "Пик за тренировку",
    hint: "Максимальное значение параметра",
  },
  {
    key: "avgValue",
    label: "Среднее за тренировку",
    hint: "Среднее значение параметра по подходам",
  },
  {
    key: "volume",
    label: "Сумма за тренировку",
    hint: "Сумма значений параметра по подходам",
  },
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
  const [selectedUnitKey, setSelectedUnitKey] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("maxValue");
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

  type UnitOption = { key: string; unitIndex: number; name?: string };

  const availableUnits = useMemo<UnitOption[]>(() => {
    if (!selectedExercise) return [];

    const map = new Map<string, UnitOption>();

    for (const training of historyInRange) {
      const exercise = training.exercises.find((ex) => ex.name === selectedExercise);
      if (!exercise?.sets?.length) continue;

      for (const set of exercise.sets) {
        const units = (set as { units?: Array<{ name?: string; value?: unknown }> })
          .units;
        if (!units?.length) continue;

        units.forEach((u, unitIndex) => {
          const name = typeof u?.name === "string" ? u.name : undefined;
          const key = name ? `name:${name}` : `index:${unitIndex}`;
          if (!map.has(key)) map.set(key, { key, unitIndex, name });
        });
      }
    }

    return [...map.values()].sort((a, b) => a.unitIndex - b.unitIndex);
  }, [historyInRange, selectedExercise]);

  const selectedUnit = useMemo(() => {
    if (!selectedUnitKey) return null;
    return availableUnits.find((u) => u.key === selectedUnitKey) ?? null;
  }, [availableUnits, selectedUnitKey]);

  const progressPoints = useMemo(() => {
    if (!selectedExercise) return [];
    if (availableUnits.length === 0) return [];

    const unit = selectedUnit ?? availableUnits[0]!;

    return [...historyInRange]
      .map((training) => {
        const exercise = training.exercises.find(
          (ex) => ex.name === selectedExercise,
        );
        const ts = new Date(training.dateStart).getTime();
        if (!exercise?.sets?.length || !Number.isFinite(ts)) return null;

        const values = exercise.sets
          .map((s) => {
            const units = (s as { units?: Array<{ name?: string; value?: unknown }> })
              .units;
            const raw = unit.name
              ? units?.find((u) => u?.name === unit.name)?.value
              : units?.[unit.unitIndex]?.value;
            return safeNumber(raw);
          })
          .filter((v): v is number => v !== null);

        if (values.length === 0) return null;

        const maxValue = Math.max(...values);
        const avgValue = values.reduce((acc, v) => acc + v, 0) / values.length;
        const setsCount = values.length;
        const volume = values.reduce((acc, v) => acc + v, 0);

        return {
          dateTs: ts,
          maxValue,
          avgValue,
          setsCount,
          volume,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.dateTs - b.dateTs);
  }, [availableUnits, historyInRange, selectedExercise, selectedUnit]);

  const summary = useMemo(() => {
    const trainingsCount = progressPoints.length;
    const totalSets = progressPoints.reduce((acc, p) => acc + p.setsCount, 0);
    const metricValues = progressPoints.map((p) => p[selectedMetric]);
    const bestValue =
      trainingsCount > 0
        ? Math.max(...metricValues)
        : 0;
    const lastValue =
      trainingsCount > 0 ? metricValues[trainingsCount - 1]! : 0;
    const firstValue = trainingsCount > 0 ? metricValues[0]! : 0;
    const delta = trainingsCount > 1 ? lastValue - firstValue : 0;

    return {
      trainingsCount,
      totalSets,
      bestValue,
      lastValue,
      delta,
    };
  }, [progressPoints, selectedMetric]);

  const chartData = useMemo(
    () =>
      progressPoints.map((point) => ({
        ...point,
        metricValue: point[selectedMetric],
      })),
    [progressPoints, selectedMetric],
  );

  const handleExerciseSelect = (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    setSelectedUnitKey(null);
    setIsModalOpen(false);
  };

  const unitSuffix = selectedUnit?.name ? ` ${selectedUnit.name}` : "";
  const selectedMetricMeta =
    METRIC_OPTIONS.find((m) => m.key === selectedMetric) ?? METRIC_OPTIONS[0]!;

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
                <DialogDescription className="sr-only">
                  Выберите упражнение для отображения статистики прогресса
                </DialogDescription>
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

          {selectedExercise && availableUnits.length > 0 && (
            <Select
              value={selectedUnitKey ?? availableUnits[0]!.key}
              onValueChange={(v) => setSelectedUnitKey(v)}
            >
              <SelectTrigger size="sm" className="w-full sm:w-[220px]">
                <SelectValue placeholder="Параметр" />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map((u) => (
                  <SelectItem key={u.key} value={u.key}>
                    {u.name ? u.name : `Параметр ${u.unitIndex + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedExercise && availableUnits.length > 0 && (
            <Select
              value={selectedMetric}
              onValueChange={(v) => setSelectedMetric(v as MetricKey)}
            >
              <SelectTrigger size="sm" className="w-full sm:w-[240px]">
                <SelectValue placeholder="Метрика графика" />
              </SelectTrigger>
              <SelectContent>
                {METRIC_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isPending ? (
        <div className="text-center py-10 text-muted-foreground">
          Загрузка...
        </div>
      ) : selectedExercise ? (
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2 md:gap-3">
            <Card className="w-full gap-2 py-3">
              <CardHeader className="px-4 pb-1">
                <CardDescription className="text-xs">Тренировки</CardDescription>
                <CardTitle className="text-xl">
                  {summary.trainingsCount}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 text-xs text-muted-foreground">
                В выбранном периоде
              </CardContent>
            </Card>

            <Card className="w-full gap-2 py-3">
              <CardHeader className="px-4 pb-1">
                <CardDescription className="text-xs">Подходы</CardDescription>
                <CardTitle className="text-xl">{summary.totalSets}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 text-xs text-muted-foreground">
                Сумма по тренировкам
              </CardContent>
            </Card>

            <Card className="w-full gap-2 py-3">
              <CardHeader className="px-4 pb-1">
                <CardDescription className="text-xs">Лучшее значение</CardDescription>
                <CardTitle className="text-xl">
                  {summary.bestValue ? `${summary.bestValue}${unitSuffix}` : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 text-xs text-muted-foreground">
                {selectedMetricMeta.label}
              </CardContent>
            </Card>

            <Card className="w-full gap-2 py-3">
              <CardHeader className="px-4 pb-1">
                <CardDescription className="text-xs">Изменение</CardDescription>
                <CardTitle className="text-xl">
                  {summary.trainingsCount > 1
                    ? `${summary.delta > 0 ? "+" : ""}${summary.delta}${unitSuffix}`
                    : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 text-xs text-muted-foreground">
                От первой к последней точке
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle>График прогресса</CardTitle>
              <CardDescription>
                {selectedMetricMeta.hint}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 md:h-80 min-w-0">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 16, right: 20, bottom: 10, left: 8 }}
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
                        padding={{ left: 16, right: 16 }}
                        tickFormatter={(value: number) =>
                          formatDate(value, "short")
                        }
                        tickMargin={10}
                        minTickGap={24}
                      />
                      <YAxis
                        tickFormatter={(v: number) =>
                          Number.isInteger(v) ? `${v}` : v.toFixed(1)
                        }
                        padding={{ top: 12, bottom: 12 }}
                        width={42}
                      />
                      <Tooltip
                        isAnimationActive={false}
                        cursor={{ stroke: "var(--border)" }}
                        labelFormatter={(label) =>
                          `Дата: ${formatDate(Number(label), "long")}`
                        }
                        formatter={(value) => [
                          `${value}${unitSuffix}`,
                          selectedMetricMeta.label,
                        ]}
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
                        dataKey="metricValue"
                        stroke="var(--chart-2)"
                        dot={{
                          r: 4.5,
                          fill: "var(--chart-2)",
                          stroke: "var(--background)",
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 7,
                          fill: "var(--background)",
                          stroke: "var(--chart-2)",
                          strokeWidth: 3,
                        }}
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
