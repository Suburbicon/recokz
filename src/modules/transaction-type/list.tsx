"use client";

import { api } from "@/shared/lib/trpc/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Typography } from "@/shared/ui/typography";
import { DeleteTransactionTypeButton } from "./delete";

export function TransactionTypeList() {
  const { data: incomeTypes } = api.transactionType.getAll.useQuery({
    category: "income",
  });
  const { data: expenseTypes } = api.transactionType.getAll.useQuery({
    category: "expense",
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <Typography size="h4-med">Список типов транзакций по доходам</Typography>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20px]">№</TableHead>
            <TableHead>Название</TableHead>
            <TableHead className="w-[20px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incomeTypes?.map((type, index) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{type.name}</TableCell>
              <TableCell className="flex items-center justify-end p-3">
                <DeleteTransactionTypeButton id={type.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography size="h4-med">Список типов транзакций по расходам</Typography>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20px]">№</TableHead>
            <TableHead>Название</TableHead>
            <TableHead className="w-[20px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenseTypes?.map((type, index) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{type.name}</TableCell>
              <TableCell className="flex items-center justify-end p-3">
                <DeleteTransactionTypeButton id={type.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
