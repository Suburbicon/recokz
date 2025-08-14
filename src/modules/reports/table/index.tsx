"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { ReportsTableTabs } from "./tabs";
import { ReportStatus } from "@prisma/client";
import dayjs from "dayjs";
import { DeleteReportButton } from "./delete-report";
import { EmptyReportsInProgress } from "./empty-states";
import { EmptyReports } from "./empty-states";
import { EmptyReportsDone } from "./empty-states";
import { api } from "@/shared/lib/trpc/client";
import { useQueryState } from "nuqs";
import { useState, ChangeEvent, FormEvent } from "react";
import { LoaderIcon } from "@/shared/ui/loader";
import { toast } from 'sonner';

export function ReportsTable() {
  const [image, setImage] = useState<File | null>(null);
  const [responseImage, setResponseImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tab] = useQueryState("tab", {
    defaultValue: "all",
    parse: (value) => value as "all" | "in_progress" | "done",
  });
  const { data: reports } = api.reports.getAll.useQuery();

  const { mutateAsync: submitImage } = api.documents.parseImage.useMutation();


  if (isLoading) {
      return (
        <div className="p-6">
          <LoaderIcon className="animate-spin" />
        </div>
      );
    }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };

  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  const customHandleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    try {
      setIsLoading(true);
      e.preventDefault();

      let imageDataUrl: string | undefined = undefined;
      if (image) {
        imageDataUrl = await toBase64(image);
        const response = await submitImage({
          imageUrl: imageDataUrl
        });
        setResponseImage(response);
        console.log(response)
      }

      setImage(null);
      const fileInput = e.currentTarget?.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      toast.error("Произошла ошибка " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (balanceInKopecks: number) => {
    return (balanceInKopecks / 100).toLocaleString("ru-RU", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 2,
    });
  };

  const allCount = reports?.length || 0;
  let inProgressCount = 0;
  let doneCount = 0;

  reports?.forEach((item) => {
    if (item.status !== ReportStatus.done) inProgressCount++;
    if (item.status === ReportStatus.done) doneCount++;
  });

  const displayedReports =
    reports?.filter((item) => {
      if (tab === "all") return true;
      if (tab === "in_progress") return item.status !== ReportStatus.done;
      if (tab === "done") return item.status === ReportStatus.done;
    }) || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-2xl font-semibold">Все сверки</h3>
          <p className="text-muted-foreground">
            {allCount} всего, {inProgressCount} в работе, {doneCount}{" "}
            завершенные
          </p>
        </div>
        <ReportsTableTabs />
      </div>

      {displayedReports.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead className="w-[200px]">Статус</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedReports.map((item, index: number) => (
              <TableRow key={index}>
                <TableCell>
                  {dayjs(item.startDate).format("DD.MM.YYYY")}
                </TableCell>
                <TableCell>{formatBalance(item.cashBalance)}</TableCell>
                <TableCell>
                  {item.status !== ReportStatus.done ? (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      В работе
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                      Завершен
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <DeleteReportButton id={item.id} />
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/cabinet/${item.id}`}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div>
        <p className='mb-3'>Считать текст с картинки</p> 
        <form onSubmit={customHandleSubmit} className='flex flex-col items-start space-y-3'>
          <label className='space-x-2 cursor-pointer'>
            <span className='p-2 bg-primary text-primary-foreground rounded-xl'>
              Загрузить
            </span>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>

          <Button type="submit" variant="default" size="sm">
            Отправить
          </Button>
        </form>
        {responseImage && (
          <div className='flex flex col items-start mt-3'>
            <p>Ответ:</p>
            <div className="flex flex-col items-start">
              {responseImage.split(',').map(el => (
                <span key={el}>{el}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      {!allCount && tab === "all" && <EmptyReports />}
      {!inProgressCount && tab === "in_progress" && <EmptyReportsInProgress />}
      {!doneCount && tab === "done" && <EmptyReportsDone />}
    </div>
  );
}
