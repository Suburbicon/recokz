"use client";

import { Button } from "@/shared/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/shared/lib/trpc/client";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type AppRouter } from "@/server";

type Props = {
  id: string;
};

export function DeleteReportButton({ id }: Props) {
  const router = useRouter();
  const utils = api.useUtils();

  const { mutate, isPending } = api.reports.delete.useMutation({
    onSuccess: () => {
      utils.reports.getAll.invalidate();
      router.push(`/cabinet/`);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error("Не удалось удалить отчет", {
        description: error.message,
      });
    },
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => mutate({ id })}
      disabled={isPending}
    >
      <Trash2 className="size-4 text-muted-foreground" />
    </Button>
  );
}
