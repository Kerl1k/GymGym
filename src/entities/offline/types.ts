export type OutboxEntry = {
  id: string;
  method: string;
  url: string;
  body: string | null;
  /** Схлопывание: одна актуальная операция на ключ */
  operationKey?: string;
  idempotencyKey: string;
  createdAt: number;
  /** Локальные id до ответа сервера (POST create) */
  context?: {
    clientTrainingId?: string;
    clientExerciseTypeId?: string;
  };
};

export type ClientIdMap = Record<string, string>;
