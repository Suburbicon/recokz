import { TransactionTypeCreate } from "@/modules/transaction-types/create";
import { TransactionTypeList } from "@/modules/transaction-types/list";

export default async function Page() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end p-6">
        <TransactionTypeCreate />
      </div>
      <TransactionTypeList />
    </div>
  );
}
