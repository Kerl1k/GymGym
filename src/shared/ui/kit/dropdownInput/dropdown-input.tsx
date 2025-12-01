import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/shared/ui/kit/dropdown-menu";
import { cn } from "@/shared/lib/css";
import { Input } from "../inputLogin";

interface DropdownInputProps {
  id: string;
  items: string[];
  value: string;
  onChange: ({ id, value }: { id: string; value: string }) => void;
  className?: string;
}

function DropdownInput({
  id,
  items,
  value,
  onChange,
  className,
}: DropdownInputProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("flex items-center gap-2", className)}>
        <Input needChevron={true} readOnly value={value} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onSelect={() => onChange({ id, value: item })}
            className="cursor-pointer w-104"
          >
            <span className="w-full">{item}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DropdownInput };
