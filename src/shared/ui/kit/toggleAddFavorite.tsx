import { FC } from "react";

import { Label } from "./label";
import { Switch } from "./switch";

type ToggleAddFavoriteProps = {
  favorite: boolean;
  handleChange: (name: string, value: boolean) => void;
  description?: string;
};

export const ToggleAddFavorite: FC<ToggleAddFavoriteProps> = ({
  favorite,
  handleChange,
  description,
}) => {
  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="favorite" className="text-base font-medium">
            Добавить в избранное
          </Label>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
        <Switch
          id="favorite"
          checked={favorite}
          onCheckedChange={(checked) => handleChange("favorite", checked)}
        />
      </div>
    </div>
  );
};
