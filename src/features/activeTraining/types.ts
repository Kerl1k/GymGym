// types/training.ts
export interface TrainingSession {
  id: string;
  name: string;
  type: string;
  exercises: TrainingExercise[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  status: "not-started" | "in-progress" | "paused" | "completed" | "resting";
  startTime: string | null;
  endTime: string | null;
}

export interface TrainingExercise {
  id: string;
  name: string;
  type: string;
  chill: string;
  weight: number;
  count: number;
  approaches: number;
  completedSets: number;
  notes?: string;
}

export interface SetResult {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  completedAt: string;
}

export interface TrainingExercise {
  id: string;
  name: string;
  type: string;
  chill: string; // время в секундах или строка "90"
  weight: number;
  count: number;
  approaches: number;
  completedSets: number;
  notes?: string;
}

export interface SetResult {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  completedAt: string;
}
