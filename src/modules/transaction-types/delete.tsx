import { api } from "@/shared/lib/trpc/client";
import { Button } from "@/shared/ui/button";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  id: string;
};

export function DeleteTransactionTypeButton({ id }: Props) {
  const utils = api.useUtils();

  const { mutate } = api.transactionType.delete.useMutation({
    onSuccess: () => {
      toast.success("Классификация транзакции успешно удалена");
      utils.transactionType.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Не удалось создать отчет", {
        description: error.message,
      });
    },
  });

  return (
    <Button variant="ghost" size="icon" onClick={() => mutate({ id })}>
      <TrashIcon size={16} />
    </Button>
  );
}
