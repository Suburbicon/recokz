import { Suspense } from "react";
import { Main } from '@/modules/connection/main'

function TransactionsTableWithSuspense() {
  return (
    <Suspense fallback={<div className="p-6">...Loading</div>}>
        <Main/>
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
