import { useTrainingFetch } from "@/entities/training-active/use-training-active";
import { ActiveTrainingContent } from "./ActiveTrainingContent";
import { ApiSchemas } from "@/shared/schema";

export type TrainingExercise = Omit<ApiSchemas["ActiveTraining"], "status"> & {
  currentExerciseIndex: number;
  exercises: (ApiSchemas["ActiveExercise"] & {
    completedSets: number;
  })[];
  status: "draft" | "in_progress" | "completed" | "cancelled" | "resting";
};

const ActiveTraining = () => {
  const { data } = useTrainingFetch();

  if (data === null) {
    return <>sosal</>;
  }

  const training: TrainingExercise = {
    ...data,
    currentExerciseIndex: 0,
    status: "in_progress",
  };

  return <ActiveTrainingContent data={training} />;
};

export const Component = ActiveTraining;
