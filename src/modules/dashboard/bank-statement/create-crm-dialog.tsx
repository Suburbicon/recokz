"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Form } from "@/shared/ui/form";
import { InputField } from "@/shared/ui/_fields/input-field";
import { SelectField } from "@/shared/ui/_fields/select-field";
import { api } from "@/shared/lib/trpc/client";
import { toast } from "sonner";

const schema = z.object({
  addedById: z.string().min(1, "Выберите сотрудника"),
  purpose: z.string().min(1, "Обязательное поле"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAmountKopecks: number;
  crmDocumentId: string | null;
  reconciliationId: string;
  bankTransactionId: string;
  onSuccess: () => void;
};

export function CreateCrmDialog({
  open,
  onOpenChange,
  bankAmountKopecks,
  crmDocumentId,
  reconciliationId,
  bankTransactionId,
  onSuccess,
}: Props) {
  const utils = api.useUtils();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { addedById: "", purpose: "" },
  });

  const { data: members = [], isLoading: isLoadingMembers } =
    api.organization.getMembers.useQuery(undefined, {
      enabled: open,
    });

  const memberOptions = members.map((m) => ({
    label: m.position ? `${m.fullName} — ${m.position}` : m.fullName,
    value: m.id,
  }));

  const { mutateAsync: createTransaction, isPending: isCreating } =
    api.transaction.create.useMutation();
  const { mutateAsync: updateBankReconcile, isPending: isLinking } =
    api.reconciliation.updateBankReconcile.useMutation({
      onSuccess: () => {
        void utils.bankStatement.getRows.invalidate();
        toast.success("CRM-транзакция создана и связана со сверкой");
        onSuccess();
        onOpenChange(false);
        form.reset();
      },
      onError: (e) => toast.error(e.message),
    });

  const pending = isCreating || isLinking;

  async function onSubmit(values: FormValues) {
    if (!crmDocumentId) {
      toast.error("В отчёте нет CRM-документа — добавьте его в отчёте");
      return;
    }
    const selectedMember = members.find((m) => m.id === values.addedById);
    if (!selectedMember) {
      toast.error("Не удалось определить сотрудника");
      return;
    }
    const tx = await createTransaction({
      amount: bankAmountKopecks,
      documentId: crmDocumentId,
      meta: {
        Purpose: values.purpose,
        "Added by": selectedMember.fullName,
        addedById: selectedMember.id,
      },
    });
    await updateBankReconcile({
      reconciliationId,
      bankTransactionId,
      crmTransactionId: tx.id,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать CRM-транзакцию</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <SelectField
              name="addedById"
              label="Кто добавил"
              placeholder={
                isLoadingMembers
                  ? "Загрузка сотрудников…"
                  : memberOptions.length === 0
                    ? "В компании нет сотрудников"
                    : "Выберите сотрудника"
              }
              options={memberOptions}
              disabled={isLoadingMembers || memberOptions.length === 0}
            />
            <InputField
              name="purpose"
              label="Назначение платежа"
              placeholder="Текст назначения"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={
                  pending || !crmDocumentId || memberOptions.length === 0
                }
              >
                {pending ? "Сохранение…" : "Создать и связать"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
