"use client";

import { useState } from "react";
import { z } from "zod";
import { emailValidator, passwordValidator } from "@/shared/lib/validators";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClerkSignUp } from "@/shared/lib/clerk";
import { Form } from "@/shared/ui/form";
import { Typography } from "@/shared/ui/typography";
import { InputField } from "@/shared/ui/_fields/input-field";
import { Button } from "@/shared/ui/button";
import Link from "next/link";

export function SignUpForm() {
  const [pendingVerification, setPendingVerification] = useState(false);

  return (
    <div>
      {!pendingVerification ? (
        <SignUp onSuccess={() => setPendingVerification(true)} />
      ) : (
        <Verify />
      )}
    </div>
  );
}

const formSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
});

function SignUp({ onSuccess }: { onSuccess: () => void }) {
  const { signUp, isLoaded, isLoading } = useClerkSignUp();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isLoaded) return;
    await signUp(values.email, values.password);
    onSuccess();
  };

  return (
    <div className="flex flex-col gap-9 items-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-9">
          <div className="flex flex-col gap-9 max-w-[540px]">
            <div className="flex flex-col gap-6 items-center">
              <Typography size="h3-med" className="text-center">
                Зарегистрироваться
              </Typography>
              <Typography size="body-16" className="text-center text-gray-200">
                Управляйте платежами онлайн. Добавляйте документы к сравнению,
                формируйте и экспортируйте отчёты за 5 минут
              </Typography>
            </div>

            <div className="flex flex-col gap-6">
              <InputField
                inputSize="lg"
                name="email"
                placeholder="Ваша почта"
              />
              <InputField
                inputSize="lg"
                name="password"
                placeholder="Ваш пароль"
                type="password"
              />

              <div id="clerk-captcha"></div>
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

      <div>
        Есть аккаунт?{" "}
        <Link href="/sign-in" className="text-blue hover:text-blue-hover">
          Войти
        </Link>
      </div>
    </div>
  );
}

const verifyFormSchema = z.object({
  code: z.string({ message: "Обязательное поле" }),
});

function Verify() {
  const { verify, isLoaded, isLoading } = useClerkSignUp();

  const form = useForm<z.infer<typeof verifyFormSchema>>({
    resolver: zodResolver(verifyFormSchema),
  });

  const handleVerify = async (values: z.infer<typeof verifyFormSchema>) => {
    if (!isLoaded) return;

    await verify(values.code);
  };

  return (
    <div className="flex flex-col gap-9 items-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleVerify)} className="space-y-9">
          <div className="flex flex-col gap-9 max-w-[540px]">
            <div className="flex flex-col gap-6 items-center">
              <Typography size="h3-med" className="text-center">
                Данные компании
              </Typography>
              <Typography size="body-16" className="text-center text-gray-200">
                Управляйте платежами онлайн. Добавляйте документы к сравнению,
                формируйте и экспортируйте отчёты за 5 минут
              </Typography>
            </div>

            <div className="flex flex-col gap-6">
              <InputField
                inputSize="lg"
                name="code"
                placeholder="Введите код, отправленный на вашу электронную почту"
              />
            </div>

            <div className="flex justify-between items-center gap-12">
              <div />
              <Button size="lg" type="submit" disabled={!isLoaded || isLoading}>
                Подтвердить
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <div>
        Есть аккаунт?{" "}
        <Link href="/sign-in" className="text-blue hover:text-blue-hover">
          Войти
        </Link>
      </div>
    </div>
  );
}
