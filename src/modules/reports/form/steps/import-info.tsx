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
import { Input } from "@/shared/ui/input";
import { CalendarIcon } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { cn } from "@/shared/lib/cn";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

dayjs.locale("ru");

export const formSchema = z.object({
  date: z.date({ message: "Обязательное поле" }),
  cashBalance: z
    .number({ message: "Обязательное поле" })
    .min(0, "Значение должно быть положительным"),
});

type SchemaType = z.infer<typeof formSchema>;

export const ImportInfoStepForm = ({
  setCurrentStatus,
}: {
  setCurrentStatus: (status: ReportStatus) => void;
}) => {
  const params = useParams<{ id: string }>();
  const utils = api.useUtils();

  const { data: report, isLoading } = api.reports.getById.useQuery({
    id: params.id,
  });

  const { mutate, isPending } = api.reports.update.useMutation({
    onSuccess: () => {
      utils.reports.getById.invalidate({ id: params.id });
      setCurrentStatus(report?.status ?? ReportStatus.import_info);
    },
  });

  const form = useForm<SchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      cashBalance: 0,
    },
  });

  useEffect(() => {
    if (report) {
      form.reset({
        date: new Date(report.startDate),
        cashBalance: report.cashBalance / 100, // Convert from kopecks to tenge
      });
    }
  }, [report, form]);

  const handleSubmit = async (values: SchemaType) => {
    if (!report) return;

    const status =
      report.status === ReportStatus.import_info
        ? ReportStatus.import_bank
        : report.status;
    mutate({
      id: params.id,
      date: values.date.toISOString(),
      cashBalance: Math.round(values.cashBalance * 100), // Convert to kopecks
      status: status,
    });
  };

  if (isLoading) {
    return <div />;
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

          <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
            <div className="rounded-lg">
              <p className="text-sm font-medium">Остаток наличных</p>
              <p className="text-xs text-gray-500 mt-1">
                На начало периода (в тенге)
              </p>
            </div>
            <div>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("cashBalance", { valueAsNumber: true })}
                className={cn(
                  form.formState.errors.cashBalance && "border-red-500",
                )}
              />
              {form.formState.errors.cashBalance && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.cashBalance.message}
                </p>
              )}
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
