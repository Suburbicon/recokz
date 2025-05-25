import { api } from "@/shared/lib/trpc/client";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  id: string;
};

export function DeleteTransactionTypeButton({ id }: Props) {
  const utils = api.useUtils();

  const { mutate } = api.transactionType.delete.useMutation({
    onSuccess: () => {
      toast.success("Тип транзакции успешно удален");
      utils.transactionType.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Не удалось создать отчет", {
        description: error.message,
      });
    },
  });

  return (
    <button
      className="text-red-400 hover:text-red-500 cursor-pointer"
      onClick={() => mutate({ id })}
    >
      <TrashIcon size={16} />
    </button>
  );
}
