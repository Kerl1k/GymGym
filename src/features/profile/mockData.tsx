/**
 * Файл с заглушками данных для профиля пользователя
 * Заменяются на реальные данные из API при интеграции
 */

// Данные пользователя (из AuthResponse и будущих эндпоинтов)
export const userData = {
  id: "123",
  email: "user@example.com",
  // Будущие поля
  name: "Алексей Петров",
  avatarUrl: null,
  level: "Продвинутый",
  joinDate: "2024-01-15",
  bio: "Люблю активный образ жизни и регулярные тренировки",
  goals: [
    "Набрать мышечную массу",
    "Улучшить выносливость",
    "Похудеть на 5 кг",
  ],
  preferences: {
    notifications: true,
    darkMode: false,
    language: "ru",
  },
  stats: {
    totalWorkouts: 47,
    totalDuration: 3420, // минуты
    totalCalories: 12500,
    currentStreak: 7,
    longestStreak: 21,
    weeklyAverage: 4.2,
  },
};

// Избранные упражнения (из /exercises?favorite=true)
export const favoriteExercisesQ = [
  {
    id: "1",
    name: "Жим лежа",
    muscleGroups: ["Грудь", "Трицепсы"],
    description:
      "Базовое упражнение для развития грудных мышц. Выполняется лежа на скамье со штангой или гантелями.",
    favorite: true,
    videoUrl: "https://example.com/videos/bench-press.mp4",
    difficulty: "Средняя",
    equipment: ["Штанга", "Скамья"],
    instructions: [
      "Лягте на скамью, ноги на полу",
      "Возьмите штангу хватом шире плеч",
      "Опустите штангу к груди",
      "Выжмите вверх до полного выпрямления рук",
    ],
  },
  {
    id: "2",
    name: "Приседания со штангой",
    muscleGroups: ["Ноги", "Ягодицы", "Кор"],
    description:
      "Фундаментальное упражнение для развития мышц ног и ягодиц. Требует правильной техники.",
    favorite: true,
    videoUrl: "https://example.com/videos/squat.mp4",
    difficulty: "Высокая",
    equipment: ["Штанга", "Стойки"],
    instructions: [
      "Поставьте штангу на трапеции",
      "Ноги на ширине плеч",
      "Опуститесь до параллели с полом",
      "Вернитесь в исходное положение",
    ],
  },
  {
    id: "3",
    name: "Подтягивания",
    muscleGroups: ["Спина", "Бицепсы"],
    description:
      "Упражнение для развития широчайших мышц спины. Можно выполнять с разным хватом.",
    favorite: true,
    videoUrl: "https://example.com/videos/pull-ups.mp4",
    difficulty: "Высокая",
    equipment: ["Турник"],
    instructions: [
      "Возьмитесь за турник прямым хватом",
      "Повисните с прямыми руками",
      "Подтянитесь до уровня подбородка",
      "Медленно опуститесь вниз",
    ],
  },
  {
    id: "4",
    name: "Планка",
    muscleGroups: ["Пресс", "Кор", "Плечи"],
    description:
      "Статическое упражнение для укрепления мышц кора и улучшения осанки.",
    favorite: true,
    videoUrl: "https://example.com/videos/plank.mp4",
    difficulty: "Легкая",
    equipment: ["Коврик"],
    instructions: [
      "Примите упор лежа на предплечьях",
      "Тело должно образовать прямую линию",
      "Напрягите пресс и ягодицы",
      "Держите положение 30-60 секунд",
    ],
  },
  {
    id: "5",
    name: "Становая тяга",
    muscleGroups: ["Спина", "Ноги", "Ягодицы"],
    description: "Комплексное упражнение для развития силы всего тела.",
    favorite: true,
    videoUrl: "https://example.com/videos/deadlift.mp4",
    difficulty: "Высокая",
    equipment: ["Штанга"],
    instructions: [
      "Поставьте ноги на ширине плеч",
      "Возьмите штангу прямым хватом",
      "Спина прямая, лопатки сведены",
      "Поднимите штангу, выпрямляя ноги и спину",
    ],
  },
  {
    id: "6",
    name: "Отжимания",
    muscleGroups: ["Грудь", "Трицепсы", "Плечи"],
    description:
      "Базовое упражнение с собственным весом для развития грудных мышц.",
    favorite: true,
    videoUrl: "https://example.com/videos/push-ups.mp4",
    difficulty: "Средняя",
    equipment: [],
    instructions: [
      "Примите упор лежа",
      "Ладони на ширине плеч",
      "Опустите тело, сгибая локти",
      "Вернитесь в исходное положение",
    ],
  },
];

// История тренировок (из /training-history)
export const trainingHistory = [
  {
    id: "1",
    dateStart: "2024-03-15T10:30:00Z",
    dateEnd: "2024-03-15T11:15:00Z",
    duration: 45, // минуты
    caloriesBurned: 320,
    exercises: [
      {
        id: "10",
        name: "Жим лежа",
        completedSets: 3,
        sets: [
          { id: 1, weight: 80, repeatCount: 10 },
          { id: 2, weight: 85, repeatCount: 8 },
          { id: 3, weight: 90, repeatCount: 6 },
        ],
        restTime: 60,
      },
      {
        id: "11",
        name: "Разведение гантелей",
        completedSets: 3,
        sets: [
          { id: 1, weight: 12, repeatCount: 12 },
          { id: 2, weight: 14, repeatCount: 10 },
          { id: 3, weight: 16, repeatCount: 8 },
        ],
        restTime: 45,
      },
      {
        id: "12",
        name: "Отжимания на брусьях",
        completedSets: 3,
        sets: [
          { id: 1, weight: 0, repeatCount: 15 },
          { id: 2, weight: 0, repeatCount: 12 },
          { id: 3, weight: 0, repeatCount: 10 },
        ],
        restTime: 45,
      },
    ],
    notes: "Хорошая тренировка, прогресс в жиме лежа",
    type: "strength",
    rating: 4,
  },
  {
    id: "2",
    dateStart: "2024-03-14T09:00:00Z",
    dateEnd: "2024-03-14T09:50:00Z",
    duration: 50,
    caloriesBurned: 380,
    exercises: [
      {
        id: "20",
        name: "Приседания",
        completedSets: 4,
        sets: [
          { id: 1, weight: 100, repeatCount: 8 },
          { id: 2, weight: 110, repeatCount: 8 },
          { id: 3, weight: 120, repeatCount: 6 },
          { id: 4, weight: 130, repeatCount: 4 },
        ],
        restTime: 90,
      },
      {
        id: "21",
        name: "Выпады",
        completedSets: 3,
        sets: [
          { id: 1, weight: 20, repeatCount: 10 },
          { id: 2, weight: 22, repeatCount: 10 },
          { id: 3, weight: 24, repeatCount: 8 },
        ],
        restTime: 60,
      },
      {
        id: "22",
        name: "Сгибания ног",
        completedSets: 3,
        sets: [
          { id: 1, weight: 40, repeatCount: 12 },
          { id: 2, weight: 45, repeatCount: 10 },
          { id: 3, weight: 50, repeatCount: 8 },
        ],
        restTime: 45,
      },
    ],
    notes: "Тяжелая тренировка ног",
    type: "strength",
    rating: 5,
  },
  {
    id: "3",
    dateStart: "2024-03-12T18:00:00Z",
    dateEnd: "2024-03-12T18:45:00Z",
    duration: 45,
    caloriesBurned: 280,
    exercises: [
      {
        id: "30",
        name: "Подтягивания",
        completedSets: 4,
        sets: [
          { id: 1, weight: 0, repeatCount: 8 },
          { id: 2, weight: 0, repeatCount: 7 },
          { id: 3, weight: 0, repeatCount: 6 },
          { id: 4, weight: 0, repeatCount: 5 },
        ],
        restTime: 60,
      },
      {
        id: "31",
        name: "Тяга штанги в наклоне",
        completedSets: 3,
        sets: [
          { id: 1, weight: 60, repeatCount: 10 },
          { id: 2, weight: 65, repeatCount: 8 },
          { id: 3, weight: 70, repeatCount: 6 },
        ],
        restTime: 60,
      },
      {
        id: "32",
        name: "Тяга гантели одной рукой",
        completedSets: 3,
        sets: [
          { id: 1, weight: 28, repeatCount: 10 },
          { id: 2, weight: 30, repeatCount: 8 },
          { id: 3, weight: 32, repeatCount: 6 },
        ],
        restTime: 45,
      },
    ],
    notes: "Хорошее ощущение в спине",
    type: "strength",
    rating: 4,
  },
  {
    id: "4",
    dateStart: "2024-03-10T08:30:00Z",
    dateEnd: "2024-03-10T09:15:00Z",
    duration: 45,
    caloriesBurned: 250,
    exercises: [
      {
        id: "40",
        name: "Бег",
        completedSets: 1,
        sets: [
          { id: 1, weight: 0, repeatCount: 30 }, // 30 минут
        ],
        restTime: 0,
      },
      {
        id: "41",
        name: "Велосипед",
        completedSets: 1,
        sets: [
          { id: 1, weight: 0, repeatCount: 15 }, // 15 минут
        ],
        restTime: 0,
      },
    ],
    notes: "Утреннее кардио",
    type: "cardio",
    rating: 3,
  },
  {
    id: "5",
    dateStart: "2024-03-08T19:00:00Z",
    dateEnd: "2024-03-08T19:40:00Z",
    duration: 40,
    caloriesBurned: 180,
    exercises: [
      {
        id: "50",
        name: "Планка",
        completedSets: 3,
        sets: [
          { id: 1, weight: 0, repeatCount: 60 },
          { id: 2, weight: 0, repeatCount: 45 },
          { id: 3, weight: 0, repeatCount: 60 },
        ],
        restTime: 30,
      },
      {
        id: "51",
        name: "Скручивания",
        completedSets: 3,
        sets: [
          { id: 1, weight: 0, repeatCount: 20 },
          { id: 2, weight: 0, repeatCount: 25 },
          { id: 3, weight: 0, repeatCount: 30 },
        ],
        restTime: 30,
      },
      {
        id: "52",
        name: "Подъем ног",
        completedSets: 3,
        sets: [
          { id: 1, weight: 0, repeatCount: 15 },
          { id: 2, weight: 0, repeatCount: 12 },
          { id: 3, weight: 0, repeatCount: 10 },
        ],
        restTime: 30,
      },
    ],
    notes: "Тренировка пресса",
    type: "flexibility",
    rating: 4,
  },
];

// Тренировки (из /trainings) - будущие избранные
export const workouts = [
  {
    id: "w1",
    name: "Силовая тренировка груди",
    description: "Комплекс упражнений для развития грудных мышц и трицепсов",
    exercises: [
      { id: "e1", name: "Жим лежа", sets: 4, reps: "8-12" },
      { id: "e2", name: "Разведение гантелей", sets: 3, reps: "10-15" },
      { id: "e3", name: "Отжимания на брусьях", sets: 3, reps: "MAX" },
      { id: "e4", name: "Жим гантелей на наклонной", sets: 3, reps: "10-12" },
    ],
    duration: 60,
    difficulty: "Средняя",
    type: "strength",
    favorite: true,
    tags: ["Грудь", "Трицепсы", "Сила"],
    createdBy: "system",
    completedCount: 12,
  },
  {
    id: "w2",
    name: "Кардио-сессия",
    description: "Интервальная кардио тренировка для сжигания жира",
    exercises: [
      { id: "e5", name: "Бег", sets: 1, reps: "20 мин" },
      { id: "e6", name: "Прыжки на скакалке", sets: 5, reps: "1 мин" },
      { id: "e7", name: "Берпи", sets: 4, reps: "15" },
    ],
    duration: 40,
    difficulty: "Высокая",
    type: "cardio",
    favorite: false,
    tags: ["Кардио", "Жиросжигание"],
    createdBy: "system",
    completedCount: 8,
  },
  {
    id: "w3",
    name: "Тренировка ног",
    description: "Комплекс для развития мышц ног и ягодиц",
    exercises: [
      { id: "e8", name: "Приседания", sets: 4, reps: "8-10" },
      { id: "e9", name: "Выпады", sets: 3, reps: "10-12" },
      { id: "e10", name: "Сгибания ног", sets: 3, reps: "12-15" },
      { id: "e11", name: "Подъем на носки", sets: 4, reps: "15-20" },
    ],
    duration: 65,
    difficulty: "Высокая",
    type: "strength",
    favorite: true,
    tags: ["Ноги", "Ягодицы"],
    createdBy: "system",
    completedCount: 15,
  },
  {
    id: "w4",
    name: "Йога для начинающих",
    description: "Базовые асаны для улучшения гибкости и расслабления",
    exercises: [
      { id: "e12", name: "Поза горы", sets: 1, reps: "30 сек" },
      { id: "e13", name: "Поза собаки мордой вниз", sets: 1, reps: "1 мин" },
      { id: "e14", name: "Поза воина", sets: 2, reps: "30 сек" },
      { id: "e15", name: "Поза ребенка", sets: 1, reps: "1 мин" },
    ],
    duration: 30,
    difficulty: "Легкая",
    type: "yoga",
    favorite: false,
    tags: ["Йога", "Гибкость", "Расслабление"],
    createdBy: "system",
    completedCount: 5,
  },
  {
    id: "w5",
    name: "Круговая тренировка",
    description: "Высокоинтенсивная круговая тренировка всего тела",
    exercises: [
      { id: "e16", name: "Берпи", sets: 3, reps: "10" },
      { id: "e17", name: "Приседания с выпрыгиванием", sets: 3, reps: "15" },
      { id: "e18", name: "Отжимания", sets: 3, reps: "12" },
      { id: "e19", name: "Планка", sets: 3, reps: "30 сек" },
    ],
    duration: 35,
    difficulty: "Высокая",
    type: "hiit",
    favorite: true,
    tags: ["Круговая", "HIIT", "Все тело"],
    createdBy: "user",
    completedCount: 20,
  },
];

// Активные тренировки (из /active-trainings)
export const activeTrainings = [
  {
    id: "a1",
    dateStart: "2024-03-16T10:00:00Z",
    exercises: [
      {
        id: "a1e1",
        name: "Жим лежа",
        muscleGroups: ["strength", "chest"],
        description: "Базовое упражнение для груди",
        restTime: 60,
        useCustomSets: false,
        completedSets: 0,
        sets: [
          { id: 1, weight: 85, repeatCount: 10 },
          { id: 2, weight: 90, repeatCount: 8 },
          { id: 3, weight: 95, repeatCount: 6 },
        ],
      },
      {
        id: "a1e2",
        name: "Тяга штанги в наклоне",
        muscleGroups: ["strength", "back"],
        description: "Упражнение для спины",
        restTime: 60,
        useCustomSets: false,
        completedSets: 0,
        sets: [
          { id: 1, weight: 70, repeatCount: 10 },
          { id: 2, weight: 75, repeatCount: 8 },
          { id: 3, weight: 80, repeatCount: 6 },
        ],
      },
    ],
    status: "planned",
    notes: "Запланированная тренировка на субботу",
  },
];

// Статистика (расчетная)
export const calculateStats = (history = trainingHistory) => {
  const totalTrainings = history.length;
  const totalDuration = history.reduce((sum, t) => sum + (t.duration || 0), 0);
  const totalCalories = history.reduce(
    (sum, t) => sum + (t.caloriesBurned || 0),
    0,
  );
  const favoriteExerciseCount = favoriteExercisesQ.length;

  // Расчет серии (упрощенный)
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const completedThisWeek = history.filter(
    (t) => new Date(t.dateStart) >= lastWeek,
  ).length;

  // Находим самое популярное упражнение
  const exerciseCounts = {};
  history.forEach((training) => {
    training.exercises.forEach((ex) => {
      exerciseCounts[ex.name] = (exerciseCounts[ex.name] || 0) + 1;
    });
  });

  const mostPopularExercise = Object.entries(exerciseCounts).sort(
    (a, b) => b[1] - a[1],
  )[0] || ["Нет данных", 0];

  return {
    totalTrainings,
    totalDuration,
    totalCalories,
    favoriteExerciseCount,
    completedThisWeek,
    streakDays: 7, // Заглушка
    mostPopularExercise: mostPopularExercise[0],
    mostPopularExerciseCount: mostPopularExercise[1],
    averageDuration: Math.round(totalDuration / totalTrainings) || 0,
    averageCalories: Math.round(totalCalories / totalTrainings) || 0,
  };
};

// Достижения пользователя
export const achievements = [
  {
    id: "1",
    title: "Первая тренировка",
    description: "Выполните первую тренировку",
    icon: "🏁",
    unlocked: true,
    unlockedDate: "2024-01-15",
    progress: 100,
  },
  {
    id: "2",
    title: "Неделя последовательности",
    description: "Тренируйтесь 7 дней подряд",
    icon: "🔥",
    unlocked: true,
    unlockedDate: "2024-01-22",
    progress: 100,
  },
  {
    id: "3",
    title: "Мастер отжиманий",
    description: "Выполните 1000 отжиманий",
    icon: "💪",
    unlocked: false,
    progress: 65,
  },
  {
    id: "4",
    title: "Кардио-энтузиаст",
    description: "Сожгите 10,000 калорий",
    icon: "🏃",
    unlocked: false,
    progress: 78,
  },
  {
    id: "5",
    title: "Силовик",
    description: "Поднимите 1000 кг за одну тренировку",
    icon: "🏋️",
    unlocked: false,
    progress: 42,
  },
];

// Рекомендации для пользователя
export const recommendations = [
  {
    id: "r1",
    type: "exercise",
    title: "Попробуйте статическую планку",
    description:
      "На основе вашей истории, вам подойдет это упражнение для улучшения кора",
    reason: "Вы редко тренируете мышцы кора",
    priority: "high",
  },
  {
    id: "r2",
    type: "workout",
    title: "Кардио-интервалы",
    description: "Добавьте кардио для улучшения выносливости",
    reason: "Последние 2 недели без кардио",
    priority: "medium",
  },
  {
    id: "r3",
    type: "rest",
    title: "День отдыха",
    description: "Рекомендуем сделать перерыв для восстановления",
    reason: "5 тренировок за последние 6 дней",
    priority: "high",
  },
];

// Вспомогательные функции
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours} ч ${mins} мин`;
  }
  return `${mins} мин`;
};

export const getWorkoutTypeIcon = (type) => {
  const icons = {
    strength: "💪",
    cardio: "🏃",
    yoga: "🧘",
    hiit: "⚡",
    flexibility: "🤸",
    balance: "⚖️",
  };
  return icons[type] || "🏋️";
};

export const getMuscleGroupColor = (muscleGroup) => {
  const colors = {
    Грудь: "#FF6B6B",
    Ноги: "#4ECDC4",
    Спина: "#45B7D1",
    Бицепсы: "#96CEB4",
    Трицепсы: "#FFEAA7",
    Плечи: "#DDA0DD",
    Пресс: "#98D8C8",
    Ягодицы: "#F7DC6F",
    Кор: "#BB8FCE",
  };
  return colors[muscleGroup] || "#BDC3C7";
};

// Экспорт всех данных
export default {
  userData,
  favoriteExercisesQ,
  trainingHistory,
  workouts,
  activeTrainings,
  achievements,
  recommendations,
  calculateStats,
  formatDate,
  formatDuration,
  getWorkoutTypeIcon,
  getMuscleGroupColor,
};
