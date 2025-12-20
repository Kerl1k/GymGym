// src/mocks/handlers/active-trainings.ts
import { ApiSchemas } from "@/shared/schema";
import { http } from "@/shared/schema/http";
import { verifyTokenOrThrow } from "@/shared/schema/session";
import { delay, HttpResponse } from "msw";

// Функция для генерации случайной даты в пределах последних 30 дней
function randomDate() {
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const end = new Date();

  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  ).toISOString();
}

// Функция для генерации случайного названия тренировки
function generateTrainingName() {
  const prefixes = [
    "Силовая",
    "Кардио",
    "Интервальная",
    "Круговая",
    "Сплит",
    "Фулбади",
    "Интенсивная",
    "Базовая",
    "Техническая",
    "Восстановительная",
  ];

  const bodyParts = [
    "на грудь",
    "на спину",
    "на ноги",
    "на плечи",
    "на руки",
    "на пресс",
    "на все тело",
    "верхней части тела",
    "нижней части тела",
    "на выносливость",
  ];

  const times = [
    "утренняя",
    "дневная",
    "вечерняя",
    "недельная",
    "понедельничная",
    "средовая",
    "пятничная",
    "выходного дня",
  ];

  const formats = [
    `${prefixes[Math.floor(Math.random() * prefixes.length)]} тренировка ${bodyParts[Math.floor(Math.random() * bodyParts.length)]}`,
    `${times[Math.floor(Math.random() * times.length)]} тренировка`,
    `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${bodyParts[Math.floor(Math.random() * bodyParts.length)]}`,
  ];

  return formats[Math.floor(Math.random() * formats.length)];
}

// Функция для генерации случайного упражнения
function generateRandomExercise(): ApiSchemas["ActiveTraining"]["exercises"][0] {
  const exerciseName = generateTrainingName();
  const muscleGroups = [
    "strength",
    "chest",
    "back",
    "legs",
    "shoulders",
    "arms",
    "abs",
    "cardio",
  ]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 3) + 1);

  const setsCount = Math.floor(Math.random() * 4) + 1; // 3-6 подходов

  const sets = Array.from({ length: setsCount }, (_, index) => ({
    id: index + 1,
    weight: Math.floor(Math.random() * 100) + 20,
    repeatCount: Math.floor(Math.random() * 15) + 5,
  }));

  return {
    id: crypto.randomUUID(),
    name: exerciseName,
    favorite: Math.random() > 0.7,
    description: `Упражнение для развития ${muscleGroups.join(", ")}`,
    muscleGroups,
    restTime: 60,
    useCustomSets: false,
    completedSets: 0,
    sets,
  };
}

// Функция для генерации случайных активных тренировок (по одной тренировке с массивом упражнений)
function generateRandomActiveTraining(): ApiSchemas["ActiveTraining"] {
  const dateStart = randomDate();

  const exercisesCount = 3;
  const exercises = Array.from({ length: exercisesCount }, () =>
    generateRandomExercise(),
  );

  return {
    id: crypto.randomUUID(),
    dateStart,
    exercises: exercises,
  };
}

// Создаем случайные активные тренировки
// eslint-disable-next-line prefer-const
let activeTrainings: ApiSchemas["ActiveTraining"][] = Array.from(
  { length: 1 },
  () => generateRandomActiveTraining(),
);

export const activeTrainingsHandlers = [
  http.get("/active-trainings", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const url = new URL(ctx.request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 10);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    await delay(300);

    let filteredTrainings = [...activeTrainings];

    // Фильтрация по дате начала
    if (startDate) {
      const start = new Date(startDate);
      filteredTrainings = filteredTrainings.filter(
        (training) => new Date(training.dateStart) >= start,
      );
    }

    // Фильтрация по дате окончания
    if (endDate) {
      const end = new Date(endDate);
      filteredTrainings = filteredTrainings.filter(
        (training) => new Date(training.dateStart) <= end,
      );
    }

    const total = filteredTrainings.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTrainings = filteredTrainings.slice(startIndex, endIndex);

    return HttpResponse.json({
      list: paginatedTrainings,
      total,
      totalPages,
    });
  }),

  http.post("/active-trainings", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const data =
      (await ctx.request.json()) as ApiSchemas["CreateActiveTraining"];
    const now = new Date().toISOString();

    // Убедимся, что у упражнений есть ID
    const exercisesWithIds = data.exercises.map((exercise) => ({
      ...exercise,
      id: exercise.id || crypto.randomUUID(),
      sets: exercise.sets.map((set, index) => ({
        ...set,
        id: set.id || index + 1,
      })),
    }));

    const training: ApiSchemas["ActiveTraining"] = {
      id: crypto.randomUUID(),
      dateStart: data.dateStart || now,
      exercises: exercisesWithIds, // Массив упражнений
    };

    activeTrainings.push(training);

    await delay(500);
    return HttpResponse.json(training, { status: 201 });
  }),

  http.get("/active-trainings/{trainingId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { trainingId } = params;

    await delay(200);

    const training = activeTrainings.find(
      (training) => training.id === trainingId,
    );

    if (!training) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(training);
  }),

  http.put("/active-trainings/{trainingId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { trainingId } = params;

    const data = (await request.json()) as ApiSchemas["UpdateActiveTraining"];

    await delay(400);

    const trainingIndex = activeTrainings.findIndex(
      (training) => training.id === trainingId,
    );

    if (trainingIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    const updatedTraining = {
      ...activeTrainings[trainingIndex],
      ...data,
    };

    // Обновляем ID подходов если нужно и есть упражнения
    if (data.exercises) {
      updatedTraining.exercises = data.exercises.map((exercise) => ({
        ...exercise,
        id: exercise.id || crypto.randomUUID(),
        sets: exercise.sets.map((set, setIndex) => ({
          ...set,
          id: set.id || setIndex + 1,
        })),
      }));
    }

    activeTrainings[trainingIndex] = updatedTraining;

    return HttpResponse.json(updatedTraining);
  }),

  http.delete("/active-trainings/{trainingId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { trainingId } = params;

    await delay(1000);

    const trainingIndex = activeTrainings.findIndex(
      (training) => training.id === trainingId,
    );

    if (trainingIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    activeTrainings.splice(trainingIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(
    "/active-trainings/{trainingId}/start",
    async ({ params, request }) => {
      await verifyTokenOrThrow(request);
      const { trainingId } = params;

      await delay(600);

      const trainingIndex = activeTrainings.findIndex(
        (training) => training.id === trainingId,
      );

      if (trainingIndex === -1) {
        return new HttpResponse(null, { status: 404 });
      }

      const training = activeTrainings[trainingIndex];
      const now = new Date().toISOString();

      // Обновляем тренировку
      const updatedTraining: ApiSchemas["ActiveTraining"] = {
        ...training,
        dateStart: now,
        exercises: training.exercises.map((exercise) => ({
          ...exercise,
          completedSets: 0,
        })),
      };

      activeTrainings[trainingIndex] = updatedTraining;

      return HttpResponse.json(updatedTraining);
    },
  ),

  http.post(
    "/active-trainings/{trainingId}/complete",
    async ({ params, request }) => {
      await verifyTokenOrThrow(request);
      const { trainingId } = params;

      await delay(800);

      const trainingIndex = activeTrainings.findIndex(
        (training) => training.id === trainingId,
      );

      if (trainingIndex === -1) {
        return new HttpResponse(null, { status: 404 });
      }

      const data = (await request.json()) as {
        completedSets: number;
        notes?: string;
      };

      const training = activeTrainings[trainingIndex];

      // Создаем запись в истории тренировок
      const historyEntry: ApiSchemas["TrainingHistory"] = {
        id: training.id,
        dateStart: training.dateStart,
        exercises: training.exercises.map((exercise) => ({
          ...exercise,
          completedSets: data.completedSets || exercise.completedSets,
        })),
      };

      // Удаляем из активных тренировок
      activeTrainings.splice(trainingIndex, 1);

      return HttpResponse.json(historyEntry);
    },
  ),

  http.post(
    "/active-trainings/{trainingId}/cancel",
    async ({ params, request }) => {
      await verifyTokenOrThrow(request);
      const { trainingId } = params;

      await delay(500);

      const trainingIndex = activeTrainings.findIndex(
        (training) => training.id === trainingId,
      );

      if (trainingIndex === -1) {
        return new HttpResponse(null, { status: 404 });
      }

      // Просто удаляем тренировку при отмене
      activeTrainings.splice(trainingIndex, 1);

      return;
    },
  ),

  // Эндпоинт для получения истории тренировок
  http.get("/training-history", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const url = new URL(ctx.request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 10);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    await delay(300);

    // Для моков создаем фиктивные завершенные тренировки
    const historyEntries: ApiSchemas["TrainingHistory"][] = Array.from(
      { length: 15 },
      () => {
        // Генерируем от 3 до 6 упражнений
        const exercisesCount = Math.floor(Math.random() * 4) + 3;
        const exercises = Array.from({ length: exercisesCount }, () => {
          const exercise = generateRandomExercise();
          return {
            ...exercise,
            completedSets: exercise.sets.length, // Все подходы выполнены
          };
        });

        return {
          id: crypto.randomUUID(),
          dateStart: randomDate(),
          exercises: exercises, // Массив упражнений
        };
      },
    );

    let filteredEntries = [...historyEntries];

    // Фильтрация по дате
    if (startDate) {
      const start = new Date(startDate);
      filteredEntries = filteredEntries.filter(
        (entry) => new Date(entry.dateStart) >= start,
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredEntries = filteredEntries.filter(
        (entry) => new Date(entry.dateStart) <= end,
      );
    }

    const total = filteredEntries.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

    return HttpResponse.json({
      list: paginatedEntries,
      total,
      totalPages,
    });
  }),
];
