import { Typography } from "@/shared/ui/typography";
import { CreateReportButton } from "./create-report";

export function EmptyReports() {
  return (
    <div className="flex flex-col items-center gap-8 pt-[100px]">
      <div className="flex flex-col items-center gap-2">
        <Typography size="h4-med" color="white">
          У вас пока нет сверок
        </Typography>
        <Typography size="body-16" color="gray-300" className="max-w-[460px] text-center">
          Все сверки появятся на этой странице, как только вы начнете работу с
          ними
        </Typography>
      </div>
      <CreateReportButton />
    </div>
  );
}

export function EmptyReportsInProgress() {
  return (
    <div className="flex flex-col items-center gap-8 pt-[100px]">
      <div className="flex flex-col items-center gap-2">
        <Typography size="h4-med" color="white">
          У вас пока нет сверок в работе
        </Typography>
        <Typography size="body-16" color="gray-300" className="max-w-[460px] text-center">
          Все сверки появятся на этой странице, как только вы начнете работу с
          ними
        </Typography>
      </div>
      <CreateReportButton />
    </div>
  );
}

export function EmptyReportsDone() {
  return (
    <div className="flex flex-col items-center gap-8 pt-[100px]">
      <div className="flex flex-col items-center gap-2">
        <Typography size="h4-med" color="white">
          У вас пока нет завершенных сверок
        </Typography>
        <Typography size="body-16" color="gray-300" className="max-w-[460px] text-center">
          Все сверки появятся на этой странице, как только вы начнете работу с
          ними
        </Typography>
      </div>
    </div>
  );
}
