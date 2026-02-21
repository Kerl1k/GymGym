import { FC, useEffect, useState } from "react";

import { RotateCcwIcon, SkipForwardIcon } from "lucide-react";

import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";

import { Timer } from "../components/timer";

type RestTimeProps = {
  restTime: number;
  isResting: boolean;
  setIsResting: React.Dispatch<React.SetStateAction<boolean>>;
};

export const RestTimer: FC<RestTimeProps> = ({
  isResting,
  setIsResting,
  restTime,
}) => {
  const [timeLeft, setTimeLeft] = useState(restTime);

  const skipRest = () => {
    setIsResting(false);
  };

  useEffect(() => {
    if (isResting) {
      setTimeLeft(restTime);
    } else {
      setIsResting(true);
    }
    if (isResting && restTime <= 0) {
      setIsResting(false);
    }
  }, [isResting, restTime, setIsResting]);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2 text-lg sm:text-xl">
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
