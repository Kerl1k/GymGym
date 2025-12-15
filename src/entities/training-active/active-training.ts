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

// Функция для генерации случайного описания тренировки
function generateTrainingDescription(name: string): string {
  const descriptions = [
    `Эффективная тренировка для достижения ваших фитнес-целей.`,
    `Комплекс упражнений для всестороннего развития.`,
    `Тренировка направлена на улучшение силовых показателей и выносливости.`,
    `Отличный выбор для поддержания формы и здоровья.`,
    `Программа тренировок, проверенная временем и атлетами.`,
    `Индивидуально подобранный комплекс упражнений.`,
  ];

  const randomDescription =
    descriptions[Math.floor(Math.random() * descriptions.length)];
  return `${name}. ${randomDescription} Рекомендуется выполнять с правильной техникой и под контролем тренера.`;
}

// Функция для генерации случайного упражнения
function generateRandomExercise(): ApiSchemas["ActiveExercise"] {
  const exerciseTypes = [
    "strength",
    "cardio",
    "flexibility",
    "balance",
    "yoga",
    "pilates",
  ] as const;
  const strengthExercises = [
    "Жим лежа",
    "Подтягивания",
    "Приседания",
    "Становая тяга",
    "Армейский жим",
    "Тяга штанги в наклоне",
    "Разведение гантелей",
    "Французский жим",
    "Подъем штанги на бицепс",
    "Жим ногами",
    "Сгибание ног",
    "Разгибание ног",
    "Подъем на носки",
  ];
  const cardioExercises = [
    "Беговая дорожка",
    "Велотренажер",
    "Гребной тренажер",
    "Скакалка",
    "Эллипс",
    "Степпер",
    "Берпи",
    "Прыжки на месте",
  ];

  const type = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
  let name: string;

  switch (type) {
    case "strength":
      name =
        strengthExercises[Math.floor(Math.random() * strengthExercises.length)];
      break;
    case "cardio":
      name =
        cardioExercises[Math.floor(Math.random() * cardioExercises.length)];
      break;
    default:
      name = `${type} упражнение`;
  }

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

  const setsCount = Math.floor(Math.random() * 4) + 3; // 3-6 подходов

  const sets = Array.from({ length: setsCount }, (_, index) => ({
    setId: crypto.randomUUID(),
    exerciseId: "", // Будет заполнено позже
    setNumber: index + 1,
    weight: type === "strength" ? Math.floor(Math.random() * 100) + 20 : 0,
    reps:
      type === "strength"
        ? Math.floor(Math.random() * 15) + 5
        : type === "cardio"
          ? Math.floor(Math.random() * 20) + 10
          : 0,
    restTime: type === "strength" ? 60 : type === "cardio" ? 30 : 90,
    completed: Math.random() > 0.5,
    completedAt: Math.random() > 0.5 ? randomDate() : "",
    notes: Math.random() > 0.7 ? "Требуется обратить внимание на технику" : "",
  }));

  return {
    id: crypto.randomUUID(),
    exerciseId: crypto.randomUUID(),
    name,
    muscleGroups,
    type,
    useCustomSets: false,
    completedSets: 0,
    sets,
    notes:
      Math.random() > 0.5
        ? `Упражнение для развития ${muscleGroups.join(", ")}`
        : "",
  };
}

// Функция для генерации случайных активных тренировок
function generateRandomActiveTrainings(
  count: number,
): ApiSchemas["ActiveTraining"][] {
  const result: ApiSchemas["ActiveTraining"][] = [];
  const statuses: Array<ApiSchemas["ActiveTraining"]["status"]> = [
    "draft",
    "in_progress",
    "completed",
    "cancelled",
  ];

  for (let i = 0; i < count; i++) {
    const createdAt = randomDate();
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    let startedAt: string | undefined;
    let completedAt: string | undefined;
    let time: number | undefined;

    if (status !== "draft") {
      startedAt = new Date(
        new Date(createdAt).getTime() + Math.random() * 86400000,
      ).toISOString();
    }

    if (status === "completed" || status === "cancelled") {
      completedAt = new Date(
        new Date(startedAt || createdAt).getTime() +
          Math.random() * 3600000 +
          1800000,
      ).toISOString();
      time = Math.floor(Math.random() * 90) + 30; // 30-120 минут
    }

    const exercisesCount = Math.floor(Math.random() * 8) + 3; // 3-10 упражнений
    const exercises = Array.from({ length: exercisesCount }, () => {
      const exercise = generateRandomExercise();
      // Обновляем exerciseId в подходах
      exercise.sets = exercise.sets.map((set) => ({
        ...set,
        exerciseId: exercise.id,
      }));
      return exercise;
    });

    const name = generateTrainingName();

    result.push({
      id: crypto.randomUUID(),
      name,
      description: Math.random() > 0.3 ? generateTrainingDescription(name) : "",
      exercises,
      time,
      status,
      startedAt,
      completedAt,
      createdAt,
      updatedAt: new Date(
        Math.min(
          new Date(completedAt || startedAt || createdAt).getTime() +
            Math.random() * 86400000,
          new Date().getTime(),
        ),
      ).toISOString(),
    });
  }

  return result;
}

// Создаем случайные активные тренировки
// eslint-disable-next-line prefer-const
let activeTrainings: ApiSchemas["ActiveTraining"][] =
  generateRandomActiveTrainings(1);

export const activeTrainingsHandlers = [
  http.get("/active-trainings", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const url = new URL(ctx.request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 10);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    await delay(300);

    let filteredTrainings = [...activeTrainings];

    // Фильтрация по статусу
    if (status) {
      filteredTrainings = filteredTrainings.filter(
        (training) => training.status === status,
      );
    }

    // Фильтрация по поиску
    if (search) {
      filteredTrainings = filteredTrainings.filter(
        (training) =>
          training.name.toLowerCase().includes(search.toLowerCase()) ||
          training.description?.toLowerCase().includes(search.toLowerCase()),
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

    // Генерируем ID для упражнений и подходов если они не предоставлены
    const exercisesWithIds = data.exercises.map((exercise) => ({
      ...exercise,
      id: exercise.id || crypto.randomUUID(),
      exerciseId: exercise.exerciseId || crypto.randomUUID(),
      sets: exercise.sets.map((set) => ({
        ...set,
        setId: set.setId || crypto.randomUUID(),
        exerciseId: exercise.id || crypto.randomUUID(),
      })),
    }));

    const training: ApiSchemas["ActiveTraining"] = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description || "",
      exercises: exercisesWithIds,
      time: undefined,
      status: data.status || "draft",
      startedAt: data.status === "in_progress" ? now : undefined,
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
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

      const data = (await request.json()) as { time?: number };

      training.status = "in_progress";
      training.startedAt = new Date().toISOString();
      if (data.time !== undefined) {
        training.time = data.time;
      }
      training.updatedAt = new Date().toISOString();

      return HttpResponse.json(training);
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

      const training = activeTrainings[trainingIndex];

      const data = (await request.json()) as { time: number; notes?: string };

      training.status = "completed";
      training.completedAt = new Date().toISOString();
      training.time = data.time;
      training.updatedAt = new Date().toISOString();

      // Создаем запись в истории тренировок
      const historyEntry: ApiSchemas["TrainingHistory"] = {
        id: training.id,
        name: training.name,
        description: training.description || "",
        exercises: training.exercises,
        time: data.time,
        status: "completed",
        startedAt: training.startedAt!,
        completedAt: training.completedAt,
        notes: data.notes || "",
      };

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

      const training = activeTrainings[trainingIndex];

      training.status = "cancelled";
      training.completedAt = new Date().toISOString();
      training.updatedAt = new Date().toISOString();

      return HttpResponse.json(training);
    },
  ),

  http.post(
    "/active-trainings/{trainingId}/exercises",
    async ({ params, request }) => {
      await verifyTokenOrThrow(request);
      const { trainingId } = params;

      await delay(400);

      const trainingIndex = activeTrainings.findIndex(
        (training) => training.id === trainingId,
      );

      if (trainingIndex === -1) {
        return new HttpResponse(null, { status: 404 });
      }

      const data = (await request.json()) as {
        exerciseId: string;
        name: string;
        muscleGroups?: string[];
        type?: string;
        sets?: ApiSchemas["TrainingSet"][];
        notes?: string;
      };

      const newExercise: ApiSchemas["ActiveExercise"] = {
        id: crypto.randomUUID(),
        exerciseId: data.exerciseId,
        name: data.name,
        muscleGroups: data.muscleGroups || ["strength"],
        type: "strength",
        completedSets: 0,
        useCustomSets: false,
        sets:
          data.sets?.map((set, index) => ({
            ...set,
            setId: set.setId || crypto.randomUUID(),
            exerciseId: data.exerciseId,
            setNumber: index + 1,
          })) ||
          Array.from({ length: 3 }, (_, index) => ({
            setId: crypto.randomUUID(),
            exerciseId: data.exerciseId,
            setNumber: index + 1,
            weight: 0,
            reps: 10,
            restTime: 60,
            completed: false,
            completedAt: "",
            notes: "",
          })),
        notes: data.notes || "",
      };

      const training = activeTrainings[trainingIndex];
      training.exercises.push(newExercise);
      training.updatedAt = new Date().toISOString();

      return HttpResponse.json(training);
    },
  ),

  http.delete(
    "/active-trainings/{trainingId}/exercises/{exerciseId}",
    async ({ params, request }) => {
      await verifyTokenOrThrow(request);
      const { trainingId, exerciseId } = params;

      await delay(300);

      const trainingIndex = activeTrainings.findIndex(
        (training) => training.id === trainingId,
      );

      if (trainingIndex === -1) {
        return new HttpResponse(null, { status: 404 });
      }

      const training = activeTrainings[trainingIndex];
      const exerciseIndex = training.exercises.findIndex(
        (exercise) => exercise.id === exerciseId,
      );

      if (exerciseIndex === -1) {
        return new HttpResponse(null, { status: 404 });
      }

      training.exercises.splice(exerciseIndex, 1);
      training.updatedAt = new Date().toISOString();

      return HttpResponse.json(training);
    },
  ),
];
