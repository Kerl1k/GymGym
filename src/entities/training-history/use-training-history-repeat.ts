import { rqClient } from "@/entities/instance";

export function useTrainingHistoryRepeat() {
  const { mutate, isPending } = rqClient.useMutation(
    "post",
    "/api/active-training/repeat",
  );

  const repeatTraining = async (
    trainingHistoryId: string,
    dateStart: string,
  ) => {
    try {
      const response = await mutate({
        body: {
          trainingHistoryId,
          dateStart,
        },
      });
      return response;
    } catch (error) {
      console.error("Failed to repeat training:", error);
      throw error;
    }
  };

  return {
    repeatTraining,
    isPending,
  };
}
