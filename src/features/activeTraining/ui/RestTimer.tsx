import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { RotateCcwIcon, SkipForwardIcon } from "lucide-react";
import { Timer } from "../components/timer";
import { Button } from "@/shared/ui/kit/button";
import { FC, useEffect } from "react";

type RestTimeProps = {
  restTime: number;
  isResting: boolean;
  setIsResting: React.Dispatch<React.SetStateAction<boolean>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
};

export const RestTimer: FC<RestTimeProps> = ({
  restTime,
  isResting,
  setIsResting,
  timeLeft,
  setTimeLeft,
}) => {
  const skipRest = () => {
    setIsResting(false);
  };

  useEffect(() => {
    if (isResting && restTime <= 0) {
      setIsResting(false);
    }
  }, [isResting, restTime, setIsResting]);

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-amber-800 flex items-center gap-2 text-lg sm:text-xl">
          <RotateCcwIcon className="h-5 w-5" />
          Отдых
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Timer
          setTimeLeft={setTimeLeft}
          timeLeft={timeLeft}
          duration={restTime}
          onComplete={() => setIsResting(false)}
        />
        <Button
          onClick={skipRest}
          variant="outline"
          className="mt-4 w-full gap-2 text-sm sm:text-base"
        >
          <SkipForwardIcon className="h-4 w-4" />
          Пропустить отдых
        </Button>
      </CardContent>
    </Card>
  );
};
