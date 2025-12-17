import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";

interface BoardsSortSelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  items: { value: T; label: string }[];
}

export function BoardsSortSelect<T extends string>({
  value,
  onValueChange,
  items,
}: BoardsSortSelectProps<T>) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id="sort" className="w-full">
        <SelectValue placeholder="Сортировка" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
