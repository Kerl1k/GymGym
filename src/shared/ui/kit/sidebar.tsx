import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";
import { Link } from "react-router-dom";
import { LayoutGridIcon, StarIcon, ClockIcon } from "lucide-react";
import { cn } from "@/shared/lib/css";

interface BoardsSidebarProps {
  className?: string;
}

export function SideBar({ className }: BoardsSidebarProps) {
  return (
    <div className={cn("w-64 border-r p-4 space-y-4", className)}>
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-500 px-2">Навигация</div>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to={ROUTES.BOARDS}>
            <LayoutGridIcon className="mr-2 h-4 w-4" />
            Все доски
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to={ROUTES.FAVORITE_BOARDS}>
            <StarIcon className="mr-2 h-4 w-4" />
            Избранное
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to={ROUTES.RECENT_BOARDS}>
            <ClockIcon className="mr-2 h-4 w-4" />
            Недавние
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to={ROUTES.EXERCISES}>
            <LayoutGridIcon className="mr-2 h-4 w-4" />
            Упраги
          </Link>
        </Button>
      </div>
    </div>
  );
}
