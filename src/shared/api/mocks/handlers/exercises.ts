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

// Функция для генерации случайного названия доски
function generateBoardName() {
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

  const randomAdjective =
    bodyParts[Math.floor(Math.random() * bodyParts.length)];

  const randomEquipment =
    equipment[Math.floor(Math.random() * equipment.length)];

  return `${randomAdjective} ${randomEquipment}`;
}

function generateType() {
  const exerciseTypes = [
    "Грудных",
    "Спины",
    "Плеч",
    "Бицепса",
    "Трицепса",
    "Ног",
    "Квадрицепса",
    "Ягодичных",
    "Икроножных",
    "Пресса",
    "Трапеций",
    "Предплечий",
    "Бедренных",
  ];

  const randomTheme =
    exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];

  return randomTheme;
}
// Генерация 1000 случайных досок
function generateRandomBoards(count: number): ApiSchemas["Exercise"][] {
  const result: ApiSchemas["Exercise"][] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = randomDate();
    const updatedAt = new Date(
      Math.min(
        new Date(createdAt).getTime() + Math.random() * 86400000 * 10,
        new Date().getTime(),
      ),
    ).toISOString(); // Добавляем до 10 дней

    result.push({
      id: crypto.randomUUID(),
      name: generateBoardName(),
      createdAt,
      updatedAt,
      type: generateType(),
      favorite: Math.random() > 0.7, // Примерно 30% досок будут избранными
    });
  }

  return result;
}

// Создаем 1000 случайных досок
const exercises: ApiSchemas["Exercise"][] = generateRandomBoards(10);

export const boardsHandlers = [
  http.get("/exercises", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const url = new URL(ctx.request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 10);
    const search = url.searchParams.get("search");
    const isFavorite = url.searchParams.get("isFavorite");
    // const sort = url.searchParams.get("sort");

    let filteredBoards = [...exercises];

    // Фильтрация по поиску
    if (search) {
      filteredBoards = filteredBoards.filter((exercises) =>
        exercises.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Фильтрация по избранному
    if (isFavorite !== null) {
      const isFav = isFavorite === "true";
      filteredBoards = filteredBoards.filter(
        (exercises) => exercises.favorite === isFav,
      );
    }

    // Сортировка
    // if (sort) {
    //   filteredBoards.sort((a, b) => {
    //     if (sort === "name") {
    //       return a.name.localeCompare(b.name);
    //     } else {
    //       // Для дат (createdAt, updatedAt, lastOpenedAt)
    //       return (
    //         new Date(
    //           b[sort as keyof ApiSchemas["Exercise"]].toString(),
    //         ).getTime() -
    //         new Date(
    //           a[sort as keyof ApiSchemas["Exercise"]].toString(),
    //         ).getTime()
    //       );
    //     }
    //   });
    // }

    const total = filteredBoards.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBoards = filteredBoards.slice(startIndex, endIndex);

    return HttpResponse.json({
      list: paginatedBoards,
      total,
      totalPages,
    });
  }),

  http.get("/exercises/{exerciseId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { exerciseId } = params;
    const exercis = exercises.find((exercises) => exercises.id === exerciseId);

    if (!exercises) {
      return;
    }

    return HttpResponse.json(exercis);
  }),

  http.post("/exercises", async (ctx) => {
    await verifyTokenOrThrow(ctx.request);

    const now = new Date().toISOString();
    const exercise: ApiSchemas["Exercise"] = {
      id: crypto.randomUUID(),
      name: "New Exercises",
      createdAt: now,
      updatedAt: now,
      favorite: false,
      type: "cardio",
    };

    exercises.push(exercise);
    return HttpResponse.json(exercise, { status: 201 });
  }),

  http.put("/exercises/{exerciseId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { exerciseId } = params;
    const exercise = exercises.find((exercises) => exercises.id === exerciseId);

    if (!exercise) {
      return;
    }

    const data = (await request.json()) as ApiSchemas["RenameBoard"];
    exercise.name = data.name;
    exercise.updatedAt = new Date().toISOString();

    return HttpResponse.json(exercise, { status: 201 });
  }),

  http.delete("/exercises/{exerciseId}", async ({ params, request }) => {
    await verifyTokenOrThrow(request);
    const { exerciseId } = params;
    const index = exercises.findIndex(
      (exercises) => exercises.id === exerciseId,
    );
    await delay(1000);
    if (index === -1) {
      return;
    }

    exercises.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
