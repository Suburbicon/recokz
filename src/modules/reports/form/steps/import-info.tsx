"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/shared/lib/trpc/client";
import { ReportStatus } from "@prisma/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CalendarIcon } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { cn } from "@/shared/lib/cn";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

dayjs.locale("ru");

export const formSchema = z
  .object({
    startDate: z.date({ message: "Обязательное поле" }),
    endDate: z.date({ message: "Обязательное поле" }),
    cashBalance: z
      .number({ message: "Обязательное поле" })
      .min(0, "Значение должно быть положительным"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Дата окончания должна быть больше или равна дате начала",
    path: ["endDate"],
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
      startDate: new Date(),
      endDate: new Date(),
      cashBalance: 0,
    },
  });

  useEffect(() => {
    if (report) {
      form.reset({
        startDate: new Date(report.startDate),
        endDate: new Date(report.endDate),
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
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
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
              <p className="text-sm font-medium">Период сверки</p>
              <p className="text-xs text-gray-500 mt-1">
                Выберите начало и конец периода
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !form.watch("startDate") && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("startDate") ? (
                      dayjs(form.watch("startDate")).format("D MMMM YYYY")
                    ) : (
                      <span>Дата начала</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("startDate")}
                    onSelect={(date: Date | undefined) =>
                      date && form.setValue("startDate", date)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-gray-500">—</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !form.watch("endDate") && "text-muted-foreground",
                      form.formState.errors.endDate && "border-red-500",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("endDate") ? (
                      dayjs(form.watch("endDate")).format("D MMMM YYYY")
                    ) : (
                      <span>Дата окончания</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("endDate")}
                    onSelect={(date: Date | undefined) =>
                      date && form.setValue("endDate", date)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {form.formState.errors.endDate && (
            <p className="text-sm text-red-500 -mt-4 ml-auto max-w-[66%]">
              {form.formState.errors.endDate.message}
            </p>
          )}

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
