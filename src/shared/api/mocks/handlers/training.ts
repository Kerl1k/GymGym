import { delay, HttpResponse } from "msw";
import { http } from "../http";
import { ApiSchemas } from "../../schema";
import { verifyTokenOrThrow } from "../session";

// Функция для генерации случайной даты в пределах последних 30 дней
function randomDate() {
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const end = new Date();
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  ).toISOString();
}

// Функция для генерации случайного названия упражнения
function generateExerciseName() {
  const exercises = [
    "Жим штанги лежа",
    "Тяга верхнего блока",
    "Разгибание ног в тренажере",
    "Сгибание ног лежа",
    "Подъем гантелей через стороны",
    "Отжимания на брусьях",
    "Приседания со штангой",
    "Выпады с гантелями",
    "Скручивания на пресс",
    "Махи гантелями вперед",
    "Тяга штанги к подбородку",
    "Шраги со штангой",
    "Пуловер с гантелью",
    "Французский жим",
    "Подъем штанги на бицепс",
    "Жим ногами в тренажере",
    "Гиперэкстензия",
    "Планка",
    "Бег на беговой дорожке",
    "Велотренажер",
  ];

  return exercises[Math.floor(Math.random() * exercises.length)];
}

// Функция для генерации типа тренировки
function generateTrainingType() {
  const types: ApiSchemas["Training"]["type"][] = [
    "strength",
    "cardio",
    "flexibility",
    "balance",
    "yoga",
    "pilates",
  ];
  return types[Math.floor(Math.random() * types.length)];
}

// Функция для генерации названия тренировки
function generateTrainingName(type: string) {
  const typeNames: Record<string, string[]> = {
    strength: [
      "Силовая тренировка на грудь",
      "Тренировка спины и бицепса",
      "Ноги и плечи",
      "Фуллбади тренировка",
      "Верх тела",
      "Ниж тела",
    ],
    cardio: [
      "Кардио сессия",
      "Интервальный бег",
      "Велотренировка",
      "Кардио для выносливости",
      "HIIT тренировка",
    ],
    flexibility: [
      "Растяжка всего тела",
      "Упражнения на гибкость",
      "Мобильность суставов",
    ],
    balance: [
      "Тренировка баланса",
      "Упражнения на стабильность",
      "Баланс и координация",
    ],
    yoga: [
      "Утренняя йога",
      "Йога для расслабления",
      "Силовая йога",
      "Хатха йога",
    ],
    pilates: [
      "Пилатес для начинающих",
      "Силовой пилатес",
      "Пилатес на коврике",
    ],
  };

  const names = typeNames[type] || ["Тренировка"];
  return names[Math.floor(Math.random() * names.length)];
}

// Функция для генерации времени отдыха
function generateChill() {
  const chillTimes = ["30 сек", "45 сек", "1 мин", "1.5 мин", "2 мин", "3 мин"];
  return chillTimes[Math.floor(Math.random() * chillTimes.length)];
}

// Функция для генерации веса
function generateWeight() {
  const weights = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80];
  return weights[Math.floor(Math.random() * weights.length)];
}

// Функция для генерации количества повторений
function generateCount() {
  const counts = [8, 10, 12, 15, 20];
  return counts[Math.floor(Math.random() * counts.length)];
}

// Функция для генерации количества подходов
function generateApproaches() {
  const approaches = [3, 4, 5];
  return approaches[Math.floor(Math.random() * approaches.length)];
}

// Функция для генерации упражнений для тренировки
function generateTrainingExercises(
  count: number = 5,
): ApiSchemas["TrainingExercise"][] {
  const exercises: ApiSchemas["TrainingExercise"][] = [];

  for (let i = 0; i < count; i++) {
    exercises.push({
      id: crypto.randomUUID(),
      name: generateExerciseName(),
      type: generateTrainingType(),
      chill: generateChill(),
      weight: generateWeight(),
      count: generateCount(),
      approaches: generateApproaches(),
    });
  }

  return exercises;
}

// Генерация случайных тренировок
function generateRandomTrainings(count: number): ApiSchemas["Training"][] {
  const result: ApiSchemas["Training"][] = [];

  for (let i = 0; i < count; i++) {
    const type = generateTrainingType();
    const createdAt = randomDate();
    const updatedAt = new Date(
      Math.min(
        new Date(createdAt).getTime() + Math.random() * 86400000 * 10,
        new Date().getTime(),
      ),
    ).toISOString();

    result.push({
      id: crypto.randomUUID(),
      name: generateTrainingName(type),
      type: type,
      exercises: generateTrainingExercises(3 + Math.floor(Math.random() * 4)), // 3-6 упражнений
      createdAt,
      updatedAt,
    });
  }

  return result;
}

// Создаем тренировки
const trainings: ApiSchemas["Training"][] = generateRandomTrainings(10);

export const trainingHandlers = [
  http.get("/trainings", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const url = new URL(ctx.request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 10);
    const search = url.searchParams.get("search");
    const type = url.searchParams.get("type");

    let filteredTrainings = [...trainings];

    // Фильтрация по поиску
    if (search) {
      filteredTrainings = filteredTrainings.filter((training) =>
        training.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Фильтрация по типу
    if (type) {
      filteredTrainings = filteredTrainings.filter(
        (training) => training.type === type,
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

  http.get("/trainings/{trainingId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { trainingId } = params;
    const training = trainings.find((training) => training.id === trainingId);

    if (!training) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(training);
  }),

  http.post("/trainings", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const data = (await ctx.request.json()) as ApiSchemas["CreateTraining"];
    const now = new Date().toISOString();

    // Проверяем, что exercises есть и это массив
    if (!data.exercises || !Array.isArray(data.exercises)) {
      return new HttpResponse(
        JSON.stringify({ error: "Exercises must be an array" }),
        { status: 400 },
      );
    }

    const training: ApiSchemas["Training"] = {
      id: crypto.randomUUID(),
      name: data.name,
      type: data.type,
      exercises: data.exercises.map((exercise) => ({
        ...exercise,
        id: exercise.id || crypto.randomUUID(),
      })),
      createdAt: now,
      updatedAt: now,
    };

    trainings.push(training);
    return HttpResponse.json(training, { status: 201 });
  }),

  http.put("/trainings/{trainingId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { trainingId } = params;
    const training = trainings.find((training) => training.id === trainingId);

    if (!training) {
      return new HttpResponse(null, { status: 404 });
    }

    const data = (await request.json()) as ApiSchemas["UpdateTraining"];

    // Обновляем только переданные поля
    if (data.name !== undefined) training.name = data.name;
    if (data.type !== undefined) training.type = data.type;
    if (data.exercises !== undefined) {
      training.exercises = data.exercises.map((exercise) => ({
        ...exercise,
        id: exercise.id || crypto.randomUUID(),
      }));
    }

    training.updatedAt = new Date().toISOString();

    return HttpResponse.json(training);
  }),

  http.delete("/trainings/{trainingId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { trainingId } = params;
    const index = trainings.findIndex((training) => training.id === trainingId);

    await delay(1000);

    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    trainings.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
