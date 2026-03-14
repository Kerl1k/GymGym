import { useFetchActiveHistrory } from "@/entities/training-history/use-active-training-history-fetch";
import { useTrainingHistoryRepeat } from "@/entities/training-history/use-training-history-repeat";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Loader } from "@/shared/ui/kit/loader";

interface TrainingHistoryListProps {
  onTrainingRepeated: () => void;
}

export const TrainingHistoryList = ({
  onTrainingRepeated,
}: TrainingHistoryListProps) => {
  const { history, isPending: isHistoryLoading } = useFetchActiveHistrory({
    limit: 5,
    sort: "dateStart",
  });
  const { repeatTraining, isPending: isRepeatLoading } =
    useTrainingHistoryRepeat();

  const handleRepeatTraining = async (trainingId: string) => {
    try {
      await repeatTraining(trainingId, new Date().toISOString());
      onTrainingRepeated();
    } catch (error) {
      console.error("Failed to repeat training:", error);
    }
  };

  if (isHistoryLoading) {
    return (
      <div style={{ marginTop: "1rem" }}>
        <Loader size="small" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg text-center">
            Последние тренировки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.map((training) => (
              <div
                key={training.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex-1">
                  <p className="font-medium">{training.name}</p>
                  <p className="text-sm text-gray-500">
                    {training.exercises.length} упражнений
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleRepeatTraining(training.id)}
                  disabled={isRepeatLoading}
                >
                  {isRepeatLoading ? "Загрузка..." : "Повторить"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
