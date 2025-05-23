"use client";

import { z } from "zod";
import { emailValidator, passwordValidator } from "@/shared/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/shared/ui/form";
import { Typography } from "@/shared/ui/typography";
import OauthSignIn from "./oauth-sign-in";
import { InputField } from "@/shared/ui/_fields/input-field";
import { Button } from "@/shared/ui/button";
import { useClerkSignIn } from "@/shared/lib/clerk";
import Link from "next/link";

const formSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
});

export function SignInForm() {
  const { signIn, isLoaded, isLoading } = useClerkSignIn();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isLoaded) return;

    await signIn(values.email, values.password);
  }

  return (
    <div className="flex flex-col gap-9 items-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-9">
          <div className="flex flex-col gap-9 max-w-[540px]">
            <div className="flex flex-col gap-6 items-center">
              <Typography size="h3-med" className="text-center">
                Ваши документы всегда под рукой
              </Typography>
              <Typography size="body-16" className="text-center text-gray-200">
                Управляйте платежами онлайн. Добавляйте документы к сравнению,
                формируйте и экспортируйте отчёты за 5 минут
              </Typography>
            </div>

            <OauthSignIn />

            <div className="flex items-center my-2">
              <div className="flex-grow h-px bg-gray-400"></div>
              <span className="px-3 text-gray-500 text-sm">или</span>
              <div className="flex-grow h-px bg-gray-400"></div>
            </div>

            <div className="flex flex-col gap-6">
              <InputField name="email" placeholder="Ваша почта" />
              <InputField
                name="password"
                placeholder="Ваш пароль"
                type="password"
              />
            </div>

            <div className="flex justify-between items-center gap-12">
              <div />
              <Button size="lg" type="submit" disabled={!isLoaded || isLoading}>
                Войти
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <Typography size="body-16" className="text-center text-gray-200">
        Нет аккаунта?{" "}
        <Link href="/sign-up" className="text-blue hover:text-blue-hover">
          Зарегистрироваться
        </Link>
      </Typography>
    </div>
  );
}
