import { ReportsTable } from "@/modules/reports/table";
import { Suspense } from "react";

function ReportsTableWithSuspense() {
  return (
    <Suspense fallback={<div className="p-6"></div>}>
      <ReportsTable />
    </Suspense>
  );
}

export default async function Page() {
  return (
    <div className="p-6">
      <ReportsTableWithSuspense />
    </div>
  );
}
