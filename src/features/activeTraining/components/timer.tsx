import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/kit/button";
import { PlayIcon, PauseIcon, RotateCcwIcon } from "lucide-react";

interface TimerProps {
  duration: number; // в секундах
  onComplete: () => void;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
}

export function Timer({
  duration,
  onComplete,
  setTimeLeft,
  timeLeft,
}: TimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration - timeLeft) / duration) * 100;

  const [isRunning, setIsRunning] = useState(true);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setTimeLeft(duration);
    setIsRunning(false);
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onComplete]);

  return (
    <div className="text-center">
      <div className="mb-4">
        <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-2">
          {minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
        </div>
        <div className="text-sm sm:text-base text-gray-600">
          Отдых до следующего подхода
        </div>
      </div>

      {/* Прогресс бар */}
      <div className="mb-6">
        <div className="h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex gap-2">
        <Button
          onClick={toggleTimer}
          variant={isRunning ? "outline" : "default"}
          className="flex-1 gap-2 text-sm sm:text-base"
        >
          {isRunning ? (
            <>
              <PauseIcon className="h-4 w-4" />
              Пауза
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4" />
              Продолжить
            </>
          )}
        </Button>

        <Button
          onClick={resetTimer}
          variant="ghost"
          className="gap-2 p-2 sm:p-3"
        >
          <RotateCcwIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Сброс</span>
        </Button>
      </div>
    </div>
  );
}
