import { Suspense } from "react";
import { TransactionsTable } from "@/modules/transactions/table";

function TransactionsTableWithSuspense() {
  return (
    <Suspense fallback={<div className="p-6"></div>}>
      <TransactionsTable />
    </Suspense>
  );
}

export default async function Page() {
  return (
    <div className="p-6">
      <TransactionsTableWithSuspense />
    </div>
  );
}
