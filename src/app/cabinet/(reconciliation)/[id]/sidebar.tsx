"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/shared/ui/sidebar";
import { Timeline, TimelineItem } from "@/shared/ui/timeline";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";
import { ReportStatus } from "@prisma/client";
import Link from "next/link";
import { Upload, CheckSquare, Receipt, ArrowLeft } from "lucide-react";
import { api } from "@/shared/lib/trpc/client";
import { useParams } from "next/navigation";
import LogoWhite from "@/shared/icons/logo-white.svg";

export function ReconciliationSidebar() {
  const params = useParams();

  const { data: report } = api.reports.getById.useQuery({
    id: params.id as string,
  });
  let timelineStep = 0;
  
  switch (report?.status) {
    case ReportStatus.import_info:
    case ReportStatus.import_bank:
    case ReportStatus.import_crm:
      timelineStep = 0;
      break;
    case ReportStatus.sales:
      timelineStep = 1;
      break;
    case ReportStatus.expenses:
      timelineStep = 2;
      break;
    case ReportStatus.done:
      timelineStep = 3;
      break;
  }

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col gap-10 p-4">
            <LogoWhite />
            <div className="p-2.5 pr-5">
              <Timeline active={timelineStep}>
                <TimelineItem
                  bullet={<Upload className="h-3 w-3" />}
                  title="Импорт"
                >
                  <Typography size="cap-14" color="gray-300">
                    Загрузите выписки из банка и данные о продажах.
                  </Typography>
                  <Typography size="cap-14" className="mt-1">
                    5 мин
                  </Typography>
                </TimelineItem>
                <TimelineItem
                  bullet={<CheckSquare className="h-3 w-3" />}
                  title="Продажи"
                >
                  <Typography size="body-14" color="gray-300">
                    Сверьте продажи с транзакциями и подтвердите
                    неподтвержденные.
                  </Typography>
                  <Typography size="cap-14" className="mt-1">
                    5 мин
                  </Typography>
                </TimelineItem>
                <TimelineItem
                  bullet={<Receipt className="h-3 w-3" />}
                  title="Расходы"
                >
                  <Typography size="body-14" color="gray-300">
                    Подтвердите назначения расходов, зафиксированных в банке.
                  </Typography>
                  <Typography size="cap-14" className="mt-1">
                    5 мин
                  </Typography>
                </TimelineItem>
              </Timeline>
            </div>
          </div>
          <div>
            <Button
              id="return-reports"
              asChild
              variant="ghost"
              className="gap-2"
            >
              <Link href="/cabinet">
                <ArrowLeft className="h-4 w-4" />
                Все сделки
              </Link>
            </Button>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
