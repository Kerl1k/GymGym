import { useCallback, useEffect, useRef, useState } from "react";

import { PlayIcon, PauseIcon, RotateCcwIcon } from "lucide-react";

import { showRestTimerDoneNotification } from "@/shared/lib/restTimerNotification";
import { Button } from "@/shared/ui/kit/button";

interface TimerProps {
  duration: number; // в секундах
  onComplete: () => void;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
}

const TICK_MS = 250;

export function Timer({
  duration,
  onComplete,
  setTimeLeft,
  timeLeft,
}: TimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress =
    duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  const [isRunning, setIsRunning] = useState(true);

  const endAtMsRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const toggleTimer = () => setIsRunning((v) => !v);

  const finishTimer = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    endAtMsRef.current = null;
    setTimeLeft(0);
    void showRestTimerDoneNotification();
    onCompleteRef.current();
  }, [setTimeLeft]);

  const syncFromDeadline = useCallback(() => {
    if (!endAtMsRef.current || completedRef.current) return;
    const left = Math.max(
      0,
      Math.ceil((endAtMsRef.current - Date.now()) / 1000),
    );
    setTimeLeft(left);
    if (left <= 0) finishTimer();
  }, [finishTimer, setTimeLeft]);

  useEffect(() => {
    if (!isRunning) {
      endAtMsRef.current = null;
      return;
    }

    completedRef.current = false;
    endAtMsRef.current = Date.now() + timeLeftRef.current * 1000;

    const tick = () => {
      if (!endAtMsRef.current || completedRef.current) return;
      const left = Math.max(
        0,
        Math.ceil((endAtMsRef.current - Date.now()) / 1000),
      );
      setTimeLeft(left);
      if (left <= 0) finishTimer();
    };

    tick();
    const interval = window.setInterval(tick, TICK_MS);

    return () => window.clearInterval(interval);
  }, [isRunning, finishTimer, setTimeLeft]);

  useEffect(() => {
    const onVis = () => syncFromDeadline();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [syncFromDeadline]);

  const resetTimer = () => {
    completedRef.current = false;
    setTimeLeft(duration);
    setIsRunning(false);
    endAtMsRef.current = null;
  };

  return (
    <div className="text-center">
      <div className="mb-4">
        <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-2">
          {minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
        </div>
        <div className="text-sm sm:text-base text-muted-foreground">
          Отдых до следующего подхода
        </div>
      </div>

      <div className="mb-6">
        <div className="h-2 sm:h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={toggleTimer}
          variant={isRunning ? "outline" : "default"}
          className="flex-1 gap-2 text-sm sm:text-base"
        >
          {isRunning ? (
            <>
              <PauseIcon className="w-4 h-4" />
              Пауза
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4" />
              Продолжить
            </>
          )}
        </Button>

        <Button
          onClick={resetTimer}
          variant="ghost"
          className="gap-2 p-2 sm:p-3"
        >
          <RotateCcwIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Сброс</span>
        </Button>
      </div>
    </div>
  );
}
