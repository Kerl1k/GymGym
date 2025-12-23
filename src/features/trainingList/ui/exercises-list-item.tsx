import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import { ApiSchemas } from "@/shared/schema";

interface exercisessListItemProps {
  training: ApiSchemas["Training"];
  rightActions?: React.ReactNode;
  menuActions?: React.ReactNode;
}

export function ExercisessListItem({
  training,
  rightActions,
  menuActions,
}: exercisessListItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0">
      <div className="flex-grow min-w-0">
        <Button
          asChild
          variant="link"
          className="text-left justify-start h-auto p-0"
        >
          <Link to={ROUTES.HOME}>
            <span className="text-lg font-medium truncate block">
              {training.name}
            </span>
          </Link>
        </Button>
        <div className="flex gap-4 text-sm text-gray-500 mt-1">
          {training.exercises.length} упражнений
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightActions}
        {menuActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">{menuActions}</DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
