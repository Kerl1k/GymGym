import { useState } from "react";

import { Eye, EyeOff } from "lucide-react";

import { Button } from "./button";

interface PasswordToggleProps {
  inputId: string;
}

export function PasswordToggle({ inputId }: PasswordToggleProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.type = showPassword ? "password" : "text";
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 absolute right-2 top-1/2 -translate-y-1/2"
      onClick={togglePasswordVisibility}
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </Button>
  );
}
