import { cn } from "@/shared/lib/css";
import { StarIcon } from "lucide-react";

interface BoardsFavoriteToggleProps {
  isFavorite: boolean;
  onToggle: () => void;
  className?: string;
}

export function BoardsFavoriteToggle({
  isFavorite,
  onToggle,
  className,
}: BoardsFavoriteToggleProps) {
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
