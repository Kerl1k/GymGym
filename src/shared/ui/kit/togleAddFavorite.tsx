import { FC } from "react";

import { Label } from "./label";
import { Switch } from "./switch";

type TogleAddFavoriteProps = {
  favorite: boolean;
  handleChange: (name: string, value: boolean) => void;
  discription?: string;
};

export const TogleAddFavorite: FC<TogleAddFavoriteProps> = ({
  favorite,
  handleChange,
  discription,
}) => {
  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="favorite" className="text-base font-medium">
            Добавить в избранное
          </Label>
          {discription && (
            <p className="text-sm text-gray-500">{discription}</p>
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
