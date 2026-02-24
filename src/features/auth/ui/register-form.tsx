import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/shared/ui/kit/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/shared/ui/kit/form";
import { Input } from "@/shared/ui/kit/input";
import { PasswordToggle } from "@/shared/ui/kit/password-toggle";

import { useRegister } from "../../../entities/auth/use-register";

const registerSchema = z.object({
  email: z.string({
    required_error: "Логин обязателен",
  }),
  password: z
    .string({
      required_error: "Пароль обязателен",
    })
    .min(6, "Пароль должен быть не менее 6 символов"),
});

export function RegisterForm() {
  const form = useForm({
    resolver: zodResolver(registerSchema),
  });

  const { errorMessage, isPending, register } = useRegister();

  const onSubmit = form.handleSubmit(register);

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Логин</FormLabel>
              <FormControl>
                <Input placeholder="kerlik" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="register-password"
                    placeholder="******"
                    type="password"
                    {...field}
                  />
                  <PasswordToggle inputId="register-password" />
                </div>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage && (
          <p className="text-destructive text-sm">{errorMessage}</p>
        )}

        <Button disabled={isPending} type="submit">
          Зарегистрироваться
        </Button>
      </form>
    </Form>
  );
}
