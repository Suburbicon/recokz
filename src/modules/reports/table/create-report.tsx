"use client";

import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/shared/lib/trpc/client";

export function CreateReportButton() {
  const router = useRouter();
  const utils = api.useUtils();

  const { mutate, isPending } = api.reports.create.useMutation({
    onSuccess: (data) => {
      utils.reports.getAll.invalidate();
      router.push(`/cabinet/${data.id}`);
    },
    onError: (error) => {
      toast.error("Не удалось создать отчет", {
        description: error.message,
      });
    },
  });

  return (
    <Button
      id="create-report"
      onClick={() => mutate()}
      size="lg"
      disabled={isPending}
    >
      <Plus className="size-4" />
      Начать новую сверку
    </Button>
  );
}
