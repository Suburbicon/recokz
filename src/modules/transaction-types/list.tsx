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
  const { data: incomeTypes } =
    api.transactionType.getTransactionTypeByCategory.useQuery({
      category: "income",
    });
  const { data: expenseTypes } =
    api.transactionType.getTransactionTypeByCategory.useQuery({
      category: "expense",
    });

  return (
    <div className="flex flex-col gap-6 p-6">
      <Typography size="h4-med">Типы транзакций по поступлениям</Typography>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20px]">№</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Комментарий</TableHead>
            <TableHead className="w-[20px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incomeTypes?.map((type, index) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{type.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {(type as any).comment || "-"}
              </TableCell>
              <TableCell className="flex items-center justify-end p-3">
                <DeleteTransactionTypeButton id={type.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography size="h4-med">Типы транзакций по выбытиям</Typography>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20px]">№</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Комментарий</TableHead>
            <TableHead className="w-[20px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenseTypes?.map((type, index) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{type.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {(type as any).comment || "-"}
              </TableCell>
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
