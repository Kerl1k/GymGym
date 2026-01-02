import { StarIcon } from "lucide-react";

import { cn } from "@/shared/lib/css";

interface ExercisesFavoriteToggleProps {
  isFavorite: boolean;
  onToggle: () => void;
  className?: string;
}

export function ExercisesFavoriteToggle({
  isFavorite,
  onToggle,
  className,
}: ExercisesFavoriteToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "p-1 rounded-full hover:bg-gray-100 transition-colors",
        className,
      )}
    >
      <StarIcon
        className={cn(
          "w-5 h-5",
          isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400",
        )}
      />
    </button>
  );
}
