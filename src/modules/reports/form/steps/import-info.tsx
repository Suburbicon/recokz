"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/shared/lib/trpc/client";
import { ReportStatus } from "@prisma/client";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { CalendarIcon } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { cn } from "@/shared/lib/cn";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

dayjs.locale("ru");

export const formSchema = z.object({
  date: z.date({ message: "Обязательное поле" }),
});

type SchemaType = z.infer<typeof formSchema>;

export const ImportInfoStepForm = () => {
  const params = useParams<{ id: string }>();
  const utils = api.useUtils();

  const { data: report, isLoading } = api.reports.getById.useQuery({
    id: params.id,
  });

  const { mutate, isPending } = api.reports.update.useMutation({
    onSuccess: () => {
      utils.reports.getById.invalidate({ id: params.id });
    },
  });

  const form = useForm<SchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  useEffect(() => {
    if (report) {
      form.reset({
        date: new Date(report.startDate),
      });
    }
  }, [report, form]);

  const handleSubmit = async (values: SchemaType) => {
    if (!report) return;

    mutate({
      id: params.id,
      date: values.date.toISOString(),
      status:
        report.status === ReportStatus.import_info
          ? ReportStatus.import_bank
          : report.status,
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-[146px] animate-pulse bg-muted rounded-md" />
      </Card>
    );
  }

  return (
    <div className="p-6">
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="space-y-6">
          <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
            <div className="rounded-lg">
              <p className="text-sm font-medium">Выберите дату</p>
            </div>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("date") && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("date") ? (
                      dayjs(form.watch("date")).format("D MMMM YYYY")
                    ) : (
                      <span>Выберите дату</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("date")}
                    onSelect={(date: Date | undefined) =>
                      date && form.setValue("date", date)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} className="w-[200px]">
              {isPending ? "Загрузка..." : "Следующий шаг"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
