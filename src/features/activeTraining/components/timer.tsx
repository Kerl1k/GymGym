// features/training-active/components/timer.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/kit/button";
import { PlayIcon, PauseIcon, RotateCcwIcon } from "lucide-react";

interface TimerProps {
  duration: number; // в секундах
  onComplete: () => void;
  autoStart?: boolean;
}

export function Timer({ duration, onComplete, autoStart = true }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

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

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setTimeLeft(duration);
    setIsRunning(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="text-center">
      <div className="mb-4">
        <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
          {minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
        </div>
        <div className="text-sm text-gray-600">Отдых до следующего подхода</div>
      </div>

      {/* Прогресс бар */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
          className="flex-1 gap-2"
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

        <Button onClick={resetTimer} variant="ghost" className="gap-2">
          <RotateCcwIcon className="h-4 w-4" />
          Сброс
        </Button>
      </div>
    </div>
  );
}
