"use client";

import { api } from "@/shared/lib/trpc/client";
import { useParams } from "next/navigation";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/ui/accordion";
import { ReportStatus } from "@prisma/client";
import { useEffect, useState } from "react";
import { ImportInfoStepForm } from "./steps/import-info";
import { ImportDocsStepForm } from "./steps/import-docs";
import { ImportSales } from "./steps/import-sales";
import { ImportExpenses } from "./steps/import-expenses";
import { ResultTable } from "./steps/import-result";

export function ReportsForm() {
  const params = useParams();
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>(
    ReportStatus.import_info,
  );

  const { data: report } = api.reports.getById.useQuery({
    id: params.id as string,
  });

  useEffect(() => {
    if (report?.status) {
      setCurrentStatus(report.status);
    }
  }, [report?.status]);

  let timelineStep = 0;
  switch (report?.status) {
    case ReportStatus.import_info:
      timelineStep = 0;
      break;
    case ReportStatus.import_bank:
      timelineStep = 1;
      break;
    case ReportStatus.import_crm:
      timelineStep = 2;
      break;
    case ReportStatus.sales:
      timelineStep = 3;
      break;
    case ReportStatus.expenses:
      timelineStep = 4;
      break;
    case ReportStatus.done:
      timelineStep = 5;
      break;
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <Accordion
          type="single"
          collapsible
          value={currentStatus}
          onValueChange={(value) => setCurrentStatus(value as ReportStatus)}
        >
          <AccordionItem
            variant="bordered"
            value={ReportStatus.import_info}
            disabled={timelineStep < 0}
          >
            <AccordionTrigger>Информация о сверке</AccordionTrigger>
            <AccordionContent>
              <ImportInfoStepForm setCurrentStatus={setCurrentStatus} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            variant="bordered"
            value={ReportStatus.import_bank}
            disabled={timelineStep < 1}
          >
            <AccordionTrigger>Загрузка документов</AccordionTrigger>
            <AccordionContent>
              <ImportDocsStepForm />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            variant="bordered"
            value={ReportStatus.sales}
            disabled={timelineStep < 3}
          >
            <AccordionTrigger>Сверка</AccordionTrigger>
            <AccordionContent>
              <ImportSales />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            variant="bordered"
            value={ReportStatus.expenses}
            disabled={timelineStep < 4}
          >
            <AccordionTrigger>Расходы</AccordionTrigger>
            <AccordionContent>
              <ImportExpenses />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            variant="bordered"
            value={ReportStatus.done}
            disabled={timelineStep < 5}
          >
            <AccordionTrigger>Итог</AccordionTrigger>
            <AccordionContent>
              <ResultTable />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
