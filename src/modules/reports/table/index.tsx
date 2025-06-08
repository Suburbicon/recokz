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

export function ReportsTable() {
  const [tab] = useQueryState("tab", {
    defaultValue: "all",
    parse: (value) => value as "all" | "in_progress" | "done",
  });
  const { data: reports } = api.reports.getAll.useQuery();

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
      {!allCount && tab === "all" && <EmptyReports />}
      {!inProgressCount && tab === "in_progress" && <EmptyReportsInProgress />}
      {!doneCount && tab === "done" && <EmptyReportsDone />}
    </div>
  );
}
