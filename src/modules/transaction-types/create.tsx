"use client";

import { api } from "@/shared/lib/trpc/client";
import { InputField } from "@/shared/ui/_fields/input-field";
import { SelectField } from "@/shared/ui/_fields/select-field";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { DialogContent } from "@/shared/ui/dialog";
import { Form } from "@/shared/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.string({ message: "Обязательное поле" }),
  type: z.enum(["income", "expense"]),
  comment: z.string().optional(),
});

export function TransactionTypeCreate() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = api.useUtils();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "income",
      comment: "",
    },
  });

  const { mutateAsync: createTransactionType } =
    api.transactionType.create.useMutation({
      onSuccess: () => {
        utils.transactionType.getAll.invalidate();
        toast.success("Классификация транзакции успешно создана");
        setIsOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createTransactionType({
      name: values.name,
      category: values.type,
      comment: values.comment || undefined,
    });
  }

  return (
    <div>
      <Button onClick={() => setIsOpen(true)} size="sm">
        Добавить
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создайте новую классификацию транзакции</DialogTitle>
            <DialogDescription>
              Классификация транзакции используется для группировки транзакций.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-9">
              <div className="flex flex-col gap-6">
                <InputField name="name" label="Название" />
                <SelectField
                  name="type"
                  label="Классификация"
                  options={[
                    { label: "Поступления", value: "income" },
                    { label: "Выбытия", value: "expense" },
                  ]}
                />
                <InputField
                  name="comment"
                  label="Комментарий"
                  placeholder="Опционально"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  Создать
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
