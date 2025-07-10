"use client";

import { api } from "@/shared/lib/trpc/client";
// import { xinValidator } from "@/shared/lib/validators";
import { InputField } from "@/shared/ui/_fields/input-field";
import { Button } from "@/shared/ui/button";
import { Form } from "@/shared/ui/form";
import { Typography } from "@/shared/ui/typography";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  name: z
    .string({ message: "Обязательное поле" })
    .min(4, "Строка должна содержать не менее 4 символов"),
  // xin: xinValidator,
});

export function OnboardingForm() {
  const router = useRouter();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      // xin: "0",
    },
  });

  const { mutateAsync: createOrganization } =
    api.organization.create.useMutation({
      onSuccess: async () => {
        await user?.reload();
        router.push("/cabinet");
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await createOrganization(values);
  };

  return (
    <div className="flex flex-col gap-9 items-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-9">
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
                name="name"
                placeholder="Название организации"
              />
              {/* <InputField
                inputSize="lg"
                name="xin"
                placeholder="ИИН"
                type="text"
              /> */}
            </div>

            <div className="flex justify-between items-center gap-12">
              <Typography size="body-14" className="text-gray-200">
                Нажимая кнопку “Продолжить”, вы
                <br /> соглашаетесь с Политикой конфиденциальности
              </Typography>
              <Button type="submit">Продолжить</Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
