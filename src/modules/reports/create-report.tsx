"use client";

import { Plus } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { useRouter } from "next/navigation";
import { api } from "@/shared/lib/trpc/client";
import { toast } from "sonner";

export const CreateReport = () => {
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
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      size="icon"
      disabled={isPending}
      onClick={() => mutate()}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
};
