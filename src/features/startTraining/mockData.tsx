/**
 * Файл с заглушками данных для страницы начала тренировки
 * Используется для разработки и тестирования без реального API
 */

import { ApiSchemas } from "@/shared/schema";

// Моковые данные тренировки
export const mockTraining = {
  id: "training-123",
  name: "Силовая тренировка груди и трицепсов",
  description: "Комплексная тренировка для развития верхней части тела",
  createdAt: "2024-03-15T10:00:00Z",
  exercises: [
    {
      exerciseId: "ex-1",
      name: "Жим лежа",
      type: ["strength", "chest"],
      notes: "Следите за техникой, не прогибайте спину",
      sets: 4,
      repeatCount: 10,
      weight: 80,
      restTime: 60,
    },
    {
      exerciseId: "ex-2",
      name: "Разведение гантелей на наклонной скамье",
      type: ["strength", "chest"],
      notes: "Контролируйте движение, не бросайте вес",
      sets: 3,
      repeatCount: 12,
      weight: 16,
      restTime: 45,
    },
    {
      exerciseId: "ex-3",
      name: "Отжимания на брусьях",
      type: ["strength", "triceps"],
      notes: "Держите корпус напряженным",
      sets: 3,
      repeatCount: 15,
      weight: 0,
      restTime: 45,
    },
    {
      exerciseId: "ex-4",
      name: "Французский жим",
      type: ["strength", "triceps"],
      notes: "Локти не разводите в стороны",
      sets: 3,
      repeatCount: 12,
      weight: 20,
      restTime: 45,
    },
  ],
};

// Моковые данные активной тренировки
export const mockActiveTraining: ApiSchemas["ActiveTraining"] = {
  id: "active-training-456",
  dateStart: new Date().toISOString(),
  exercises: [
    {
      id: "active-ex-1",
      name: "Жим лежа",
      favorite: false,
      description: "Следите за техникой, не прогибайте спину",
      muscleGroups: ["strength", "chest"],
      restTime: 60,
      useCustomSets: false,
      completedSets: 0,
      sets: [
        { id: 1, weight: 80, repeatCount: 10 },
        { id: 2, weight: 85, repeatCount: 8 },
        { id: 3, weight: 90, repeatCount: 6 },
        { id: 4, weight: 85, repeatCount: 8 },
      ],
    },
    {
      id: "active-ex-2",
      name: "Разведение гантелей на наклонной скамье",
      favorite: false,
      description: "Контролируйте движение, не бросайте вес",
      muscleGroups: ["strength", "chest"],
      restTime: 45,
      useCustomSets: false,
      completedSets: 0,
      sets: [
        { id: 1, weight: 16, repeatCount: 12 },
        { id: 2, weight: 18, repeatCount: 10 },
        { id: 3, weight: 20, repeatCount: 8 },
      ],
    },
    {
      id: "active-ex-3",
      name: "Отжимания на брусьях",
      favorite: false,
      description: "Держите корпус напряженным",
      muscleGroups: ["strength", "triceps"],
      restTime: 45,
      useCustomSets: false,
      completedSets: 0,
      sets: [
        { id: 1, weight: 0, repeatCount: 15 },
        { id: 2, weight: 0, repeatCount: 12 },
        { id: 3, weight: 0, repeatCount: 10 },
      ],
    },
    {
      id: "active-ex-4",
      name: "Французский жим",
      favorite: false,
      description: "Локти не разводите в стороны",
      muscleGroups: ["strength", "triceps"],
      restTime: 45,
      useCustomSets: false,
      completedSets: 0,
      sets: [
        { id: 1, weight: 20, repeatCount: 12 },
        { id: 2, weight: 22, repeatCount: 10 },
        { id: 3, weight: 24, repeatCount: 8 },
      ],
    },
  ],
};

// Моковый хук для получения тренировки
export const useMockTrainingFetchId = (trainingId: string) => {
  console.log("Fetching training with ID:", trainingId);
  return {
    data: mockTraining,
    isLoading: false,
    error: null,
  };
};

// Моковый хук для обновления активной тренировки
export const useMockUpdateActiveTraining = () => {
  return {
    isPending: false,
    mutate: async (data: ApiSchemas["UpdateActiveTraining"]) => {
      console.log("Mock update active training:", data);
      return { success: true };
    },
  };
};

// Вспомогательная функция для генерации уникальных ID
export const generateMockSets = (
  exercise: { weight?: number; repeatCount?: number },
  count = 3,
) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    weight: exercise.weight || 0,
    repeatCount: exercise.repeatCount || 10,
  }));
};

// Экспорт всех моковых данных
export default {
  mockTraining,
  mockActiveTraining,
  useMockTrainingFetchId,
  useMockUpdateActiveTraining,
  generateMockSets,
};
