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

// Список упражнений для моков
const exerciseList = [
  {
    id: "1",
    name: "Жим штанги лежа",
    type: ["strength"],
    notes: "Базовое упражнение для груди",
  },
  {
    id: "2",
    name: "Приседания со штангой",
    type: ["strength", "legs"],
    notes: "Основное упражнение для ног",
  },
  {
    id: "3",
    name: "Тяга штанги в наклоне",
    type: ["strength", "back"],
    notes: "Для развития мышц спины",
  },
  {
    id: "4",
    name: "Бег на беговой дорожке",
    type: ["cardio"],
    notes: "Кардионагрузка, 30 минут",
  },
  {
    id: "5",
    name: "Подтягивания широким хватом",
    type: ["strength", "back"],
    notes: "Упражнение с весом тела",
  },
  {
    id: "6",
    name: "Отжимания на брусьях",
    type: ["strength", "chest", "triceps"],
    notes: "Для груди и трицепсов",
  },
  {
    id: "7",
    name: "Скручивания на пресс",
    type: ["strength", "abs"],
    notes: "Упражнение на пресс",
  },
  {
    id: "8",
    name: "Выпады с гантелями",
    type: ["strength", "legs"],
    notes: "Для ягодиц и квадрицепсов",
  },
  {
    id: "9",
    name: "Становая тяга",
    type: ["strength", "back", "legs"],
    notes: "Комплексное упражнение",
  },
  {
    id: "10",
    name: "Жим гантелей сидя",
    type: ["strength", "shoulders"],
    notes: "Для дельтовидных мышц",
  },
];

// Функция для генерации случайного названия тренировки
function generateTrainingName() {
  const prefixes = [
    "Утренняя",
    "Вечерняя",
    "Интенсивная",
    "Базовая",
    "Специальная",
    "Профильная",
    "Домашняя",
    "Заловая",
    "Кардио",
    "Силовая",
  ];

  const targets = [
    "на грудь",
    "на спину",
    "на ноги",
    "на плечи",
    "на руки",
    "на всё тело",
    "на выносливость",
    "на силу",
    "на массу",
    "на рельеф",
  ];

  const times = [
    "понедельника",
    "вторника",
    "среды",
    "четверга",
    "пятницы",
    "субботы",
    "воскресенья",
    "начала недели",
    "конца недели",
  ];

  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomTarget = targets[Math.floor(Math.random() * targets.length)];
  const randomTime = times[Math.floor(Math.random() * times.length)];

  return `${randomPrefix} тренировка ${randomTarget} для ${randomTime}`;
}

// Функция для генерации случайных упражнений для тренировки
function generateRandomExercises(): ApiSchemas["ExerciseForm"][] {
  const count = Math.floor(Math.random() * 5) + 3; // От 3 до 7 упражнений
  const shuffledExercises = [...exerciseList].sort(() => 0.5 - Math.random());

  return shuffledExercises.slice(0, count).map((ex) => ({
    id: crypto.randomUUID(),
    exerciseId: ex.id,
    name: ex.name,
    type: ex.type,
    notes: ex.notes,
  }));
}

// Генерация случайных тренировок
function generateRandomTrainings(count: number): ApiSchemas["Training"][] {
  const result: ApiSchemas["Training"][] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = randomDate();
    const updatedAt = new Date(
      Math.min(
        new Date(createdAt).getTime() + Math.random() * 86400000 * 10,
        new Date().getTime(),
      ),
    ).toISOString();

    result.push({
      id: crypto.randomUUID(),
      name: generateTrainingName(),
      exercises: generateRandomExercises(),
      createdAt,
      updatedAt,
    });
  }

  return result;
}

// Создаем моковые тренировки
const trainings: ApiSchemas["Training"][] = generateRandomTrainings(15);

export const trainingsHandlers = [
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

    // Фильтрация по типу (если есть упражнения такого типа)
    if (type) {
      filteredTrainings = filteredTrainings.filter((training) =>
        training.exercises.some((exercise) => exercise.type.includes(type)),
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
    const training = trainings.find((t) => t.id === trainingId);

    if (!training) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(training);
  }),

  http.post("/trainings", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const data = (await ctx.request.json()) as ApiSchemas["CreateTraining"];
    const now = new Date().toISOString();

    const training: ApiSchemas["Training"] = {
      id: crypto.randomUUID(),
      name: data.name,
      exercises: data.exercises.map((ex) => ({
        ...ex,
        id: crypto.randomUUID(), // Генерируем новые ID для упражнений
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
    const training = trainings.find((t) => t.id === trainingId);

    if (!training) {
      return new HttpResponse(null, { status: 404 });
    }

    const data = (await request.json()) as ApiSchemas["UpdateTraining"];

    // Обновляем только переданные поля
    if (data.name !== undefined) training.name = data.name;
    if (data.exercises !== undefined) {
      // Обновляем ID упражнений при необходимости
      training.exercises = data.exercises.map((ex) => ({
        ...ex,
        id: ex.id || crypto.randomUUID(),
      }));
    }

    training.updatedAt = new Date().toISOString();

    return HttpResponse.json(training);
  }),

  http.delete("/trainings/{trainingId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { trainingId } = params;
    const index = trainings.findIndex((t) => t.id === trainingId);

    await delay(1000);

    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    trainings.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
