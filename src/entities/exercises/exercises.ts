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

// Функция для генерации случайного названия упражнения
function generateExerciseName() {
  const bodyParts = [
    "Жим",
    "Тяга",
    "Разгибание",
    "Сгибание",
    "Подъем",
    "Отжимание",
    "Приседание",
    "Выпад",
    "Скручивание",
    "Махи",
    "Протяжка",
    "Шраги",
    "Пуловер",
  ];

  const equipment = [
    "со штангой",
    "с гантелями",
    "в тренажере",
    "на брусьях",
    "в кроссовере",
    "с гирей",
    "на турнике",
    "с резиной",
    "с диском",
    "на полу",
    "в Смите",
    "с медболом",
  ];

  const targets = [
    "груди",
    "спины",
    "ног",
    "плеч",
    "рук",
    "пресса",
    "ягодиц",
    "икр",
    "бицепса",
    "трицепса",
  ];

  const randomBodyPart =
    bodyParts[Math.floor(Math.random() * bodyParts.length)];
  const randomEquipment =
    equipment[Math.floor(Math.random() * equipment.length)];
  const randomTarget = targets[Math.floor(Math.random() * targets.length)];

  // Случайно выбираем один из форматов названия
  const formats = [
    `${randomBodyPart} ${randomEquipment}`,
    `${randomBodyPart} для ${randomTarget}`,
    `${randomBodyPart} ${randomEquipment} для ${randomTarget}`,
  ];

  return formats[Math.floor(Math.random() * formats.length)];
}

// Функция для генерации случайных мышечных групп
function generateMuscleGroups(): string[] {
  const allMuscleGroups = [
    "Грудь",
    "Спина",
    "Ноги",
    "Плечи",
    "Бицепс",
    "Трицепс",
    "Пресс",
    "Ягодицы",
    "Икры",
    "Предплечья",
    "Трапеции",
    "Широчайшие",
    "Квадрицепс",
    "Бицепс бедра",
  ];

  // Выбираем от 1 до 3 мышечных групп
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...allMuscleGroups].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Функция для генерации случайного описания
function generateDescription(name: string): string {
  const descriptions = [
    `Базовое упражнение для развития целевых мышц.`,
    `Эффективное упражнение для проработки мышечных групп.`,
    `Популярное упражнение среди атлетов всех уровней.`,
    `Отлично подходит для развития силы и мышечной массы.`,
    `Рекомендуется выполнять с правильной техникой.`,
    `Упражнение способствует улучшению силовых показателей.`,
  ];

  const randomDescription =
    descriptions[Math.floor(Math.random() * descriptions.length)];
  return `${name}. ${randomDescription} Важно соблюдать правильную технику выполнения.`;
}

// Функция для генерации случайной ссылки на видео
function generateVideoUrl(): string {
  const videoIds = [
    "dQw4w9WgXcQ",
    "9bZkp7q19f0",
    "kJQP7kiw5Fk",
    "OPf0YbXqDm0",
    "CduA0TULnow",
    "KYniUCGPGLs",
    "n6P0SitRwy8",
    "pRpeEdMmmQ0",
    "7PCkvCPvDXk",
    "wtHra9tFISY",
  ];

  const randomId = videoIds[Math.floor(Math.random() * videoIds.length)];
  return `https://youtube.com/watch?v=${randomId}`;
}

// Генерация случайных упражнений
function generateRandomExercises(count: number): ApiSchemas["Exercise"][] {
  const result: ApiSchemas["Exercise"][] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = randomDate();
    const updatedAt = new Date(
      Math.min(
        new Date(createdAt).getTime() + Math.random() * 86400000 * 10,
        new Date().getTime(),
      ),
    ).toISOString();

    const name = generateExerciseName();
    const muscleGroups = generateMuscleGroups();

    result.push({
      id: crypto.randomUUID(),
      name,
      favorite: Math.random() > 0.7, // Примерно 30% упражнений будут избранными
      muscleGroups,
      description: Math.random() > 0.3 ? generateDescription(name) : "", // 70% упражнений имеют описание
      videoUrl: generateVideoUrl(),
      createdAt,
      updatedAt,
    });
  }

  return result;
}

// Создаем случайные упражнения
const exercises: ApiSchemas["Exercise"][] = generateRandomExercises(10);

export const exercisesHandlers = [
  http.get("/exercises", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const url = new URL(ctx.request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 10);
    const search = url.searchParams.get("search");
    const favorite = url.searchParams.get("favorite");
    const muscleGroup = url.searchParams.get("muscleGroup");

    let filteredExercises = [...exercises];

    // Фильтрация по поиску
    if (search) {
      filteredExercises = filteredExercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Фильтрация по избранному
    if (favorite !== null) {
      const isFavorite = favorite === "true";
      filteredExercises = filteredExercises.filter(
        (exercise) => exercise.favorite === isFavorite,
      );
    }

    // Фильтрация по мышечной группе
    if (muscleGroup) {
      filteredExercises = filteredExercises.filter((exercise) =>
        exercise.muscleGroups.some((group) =>
          group.toLowerCase().includes(muscleGroup.toLowerCase()),
        ),
      );
    }

    const total = filteredExercises.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedExercises = filteredExercises.slice(startIndex, endIndex);

    return HttpResponse.json({
      list: paginatedExercises,
      total,
      totalPages,
    });
  }),

  http.get("/exercises/{exerciseId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { exerciseId } = params;
    const exercise = exercises.find((exercise) => exercise.id === exerciseId);

    if (!exercise) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(exercise);
  }),

  http.post("/exercises", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const data = (await ctx.request.json()) as ApiSchemas["CreateExercise"];
    const now = new Date().toISOString();

    const exercise: ApiSchemas["Exercise"] = {
      id: crypto.randomUUID(),
      name: data.name,
      favorite: data.favorite || false,
      muscleGroups: data.muscleGroups,
      description: data.description || "",
      videoUrl: data.videoUrl,
      createdAt: now,
      updatedAt: now,
    };

    exercises.push(exercise);
    return HttpResponse.json(exercise, { status: 201 });
  }),

  http.put("/exercises/{exerciseId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { exerciseId } = params;
    const exercise = exercises.find((exercise) => exercise.id === exerciseId);

    if (!exercise) {
      return new HttpResponse(null, { status: 404 });
    }

    const data = (await request.json()) as ApiSchemas["UpdateExercise"];

    // Обновляем только переданные поля
    if (data.name !== undefined) exercise.name = data.name;
    if (data.favorite !== undefined) exercise.favorite = data.favorite;
    if (data.muscleGroups !== undefined)
      exercise.muscleGroups = data.muscleGroups;
    if (data.description !== undefined) exercise.description = data.description;
    if (data.videoUrl !== undefined) exercise.videoUrl = data.videoUrl;

    exercise.updatedAt = new Date().toISOString();

    return HttpResponse.json(exercise);
  }),

  http.delete("/exercises/{exerciseId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { exerciseId } = params;
    const index = exercises.findIndex((exercise) => exercise.id === exerciseId);

    await delay(1000);

    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    exercises.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
