import { useCallback, useEffect, useRef, useState } from "react";

import { PlayIcon, PauseIcon, RotateCcwIcon } from "lucide-react";

import {
  showRestTimerDoneNotification,
  vibrateRestTimerDone,
} from "@/shared/lib/restTimerNotification";
import { Button } from "@/shared/ui/kit/button";

interface TimerProps {
  duration: number; // в секундах
  onComplete: () => void;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
}

const TICK_MS = 250;
const ADJUST_STEP_SEC = 15;

export function Timer({
  duration,
  onComplete,
  setTimeLeft,
  timeLeft,
}: TimerProps) {
  const [extraSec, setExtraSec] = useState(0);
  const [restartToken, setRestartToken] = useState(0);
  const totalDuration = Math.max(duration + extraSec, 1);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = Math.min(
    100,
    Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100),
  );

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
    vibrateRestTimerDone();
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
    // setInterval is throttled in background tabs; a single timeout at the
    // deadline fires the notification closer to the actual end of rest.
    const deadline = window.setTimeout(
      () => {
        if (!completedRef.current) finishTimer();
      },
      Math.max(0, timeLeftRef.current * 1000),
    );

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(deadline);
    };
  }, [isRunning, restartToken, finishTimer, setTimeLeft]);

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
    setExtraSec(0);
    setTimeLeft(duration);
    setIsRunning(false);
    endAtMsRef.current = null;
  };

  const adjustTime = (deltaSec: number) => {
    if (completedRef.current) return;
    const current = endAtMsRef.current
      ? Math.max(0, Math.ceil((endAtMsRef.current - Date.now()) / 1000))
      : timeLeftRef.current;
    const next = Math.max(0, current + deltaSec);
    setExtraSec((prev) => prev + (next - current));
    setTimeLeft(next);
    // Restarts the running effect so the deadline timeout matches the new end.
    if (isRunning) setRestartToken((t) => t + 1);
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

      <div className="mb-2 flex gap-2">
        <Button
          onClick={() => adjustTime(-ADJUST_STEP_SEC)}
          variant="outline"
          className="flex-1 text-sm tabular-nums sm:text-base"
          disabled={timeLeft <= 0}
          aria-label={`Убавить ${ADJUST_STEP_SEC} секунд`}
        >
          −{ADJUST_STEP_SEC} с
        </Button>
        <Button
          onClick={() => adjustTime(ADJUST_STEP_SEC)}
          variant="outline"
          className="flex-1 text-sm tabular-nums sm:text-base"
          aria-label={`Добавить ${ADJUST_STEP_SEC} секунд`}
        >
          +{ADJUST_STEP_SEC} с
        </Button>
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
