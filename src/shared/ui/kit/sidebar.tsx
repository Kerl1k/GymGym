import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";
import { Link } from "react-router-dom";
import { LayoutGridIcon } from "lucide-react";
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
          <Link to={ROUTES.HOME}>
            <LayoutGridIcon className="mr-2 h-4 w-4" />
            Упражнения
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to={ROUTES.TRAINING}>
            <LayoutGridIcon className="mr-2 h-4 w-4" />
            Тренировки
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to={ROUTES.ACTIVE_TRAINING}>
            <LayoutGridIcon className="mr-2 h-4 w-4" />
            Начать тренировку
          </Link>
        </Button>
      </div>
    </div>
  );
}
