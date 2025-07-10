"use client";

import { useParams } from "next/navigation";
import { api } from "@/shared/lib/trpc/client";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
import { Skeleton } from "@/shared/ui/skeleton";

export function ResultTable() {
  const params = useParams<{ id: string }>();

  const { data: report, isLoading } = api.reports.getById.useQuery({
    id: params.id,
  });

  const formatBalance = (balanceInKopecks: number) => {
    return (balanceInKopecks / 100).toLocaleString("ru-RU", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 2,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Отчет не найден</p>
      </div>
    );
  }

  const bankDocuments =
    report.documents?.filter((document) => document.type === "bank") || [];

  const crmDocuments =
    report.documents?.filter((document) => document.type === "crm") || [];

  const totalStartBalance = bankDocuments.reduce(
    (sum, doc) => sum + doc.balance,
    0,
  );

  // Cash balance from report (converted from kopecks to display format)
  const reportCashBalance = report.cashBalance || 0;

  // Total starting balance including cash
  const totalStartBalanceWithCash = totalStartBalance + reportCashBalance;

  // Calculate income and expenses from reconciliations
  const totalIncome =
    report.reconciliations
      ?.filter((reconciliation) => {
        const amount =
          (reconciliation.bankTransaction?.amount &&
            reconciliation.crmTransaction?.amount) ||
          0;
        return amount > 0;
      })
      .reduce((sum, reconciliation) => {
        const amount =
          (reconciliation.bankTransaction?.amount &&
            reconciliation.crmTransaction?.amount) ||
          0;
        return sum + amount;
      }, 0) || 0;

  const totalExpenses =
    report.reconciliations
      ?.filter((reconciliation) => {
        const amount =
          (reconciliation.bankTransaction?.amount &&
            reconciliation.crmTransaction?.amount) ||
          0;
        return amount < 0;
      })
      .reduce((sum, reconciliation) => {
        const amount =
          (reconciliation.bankTransaction?.amount &&
            reconciliation.crmTransaction?.amount) ||
          0;
        return sum + Math.abs(amount);
      }, 0) || 0;

  const totalNotMatchedBankDocuments =
    report.reconciliations
      ?.filter((r) => {
        return r.bankTransaction?.amount && !r.crmTransactionId;
      })
      .reduce((sum, r) => {
        const amount = r.bankTransaction?.amount || 0;
        return sum + amount;
      }, 0) || 0;

  const totalNotMatchedCrmDocuments =
    report.reconciliations
      ?.filter((r) => {
        return r.crmTransaction?.amount && !r.bankTransactionId;
      })
      .reduce((sum, r) => {
        const amount = r.crmTransaction?.amount || 0;
        return sum + amount;
      }, 0) || 0;

  // Calculate end balances
  const totalEndBalance = totalIncome - totalExpenses;
  const reportEndCashBalance = reportCashBalance; // Assuming cash doesn't change through bank transactions

  // Group reconciliations by transaction type for detailed breakdown
  const incomeByType: Record<string, number> = {};
  const expensesByType: Record<string, number> = {};

  report.reconciliations?.forEach((reconciliation) => {
    const amount =
      (reconciliation.bankTransaction?.amount &&
        reconciliation.crmTransaction?.amount) ||
      0;
    const typeName = reconciliation.type?.name || "Без категории";

    if (amount > 0) {
      incomeByType[typeName] = (incomeByType[typeName] || 0) + amount;
    } else if (amount < 0) {
      expensesByType[typeName] =
        (expensesByType[typeName] || 0) + Math.abs(amount);
    }
  });

  return (
    <div className="space-y-6 p-6">
      {/* Detailed Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-64">Показатель</TableHead>
              {bankDocuments.map((document) => (
                <TableHead key={document.id} className="text-right">
                  {document.name}
                </TableHead>
              ))}
              <TableHead className="text-right">Итого</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Income section */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">Продажи за период</TableCell>
              {bankDocuments.map((document) => {
                const documentIncome =
                  report.reconciliations
                    ?.filter((r) => {
                      const amount =
                        (r.bankTransaction?.amount &&
                          r.crmTransaction?.amount) ||
                        0;
                      const isFromThisDoc =
                        r.bankTransaction?.document?.id === document.id ||
                        r.crmTransaction?.document?.id === document.id;
                      return amount > 0 && isFromThisDoc;
                    })
                    .reduce((sum, r) => {
                      const amount =
                        (r.bankTransaction?.amount &&
                          r.crmTransaction?.amount) ||
                        0;
                      return sum + amount;
                    }, 0) || 0;

                return (
                  <TableCell key={document.id} className="text-right font-bold">
                    {formatBalance(documentIncome)}
                  </TableCell>
                );
              })}
              <TableCell className="text-right font-bold">
                {formatBalance(totalIncome)}
              </TableCell>
            </TableRow>

            {/* Detailed income breakdown */}
            {Object.entries(incomeByType).map(([typeName, amount]) => (
              <TableRow key={typeName}>
                <TableCell className="pl-8">• {typeName}</TableCell>
                {bankDocuments.map((document) => {
                  const documentTypeIncome =
                    report.reconciliations
                      ?.filter((r) => {
                        const reconciliationAmount =
                          (r.bankTransaction?.amount &&
                            r.crmTransaction?.amount) ||
                          0;
                        const isFromThisDoc =
                          r.bankTransaction?.document?.id === document.id ||
                          r.crmTransaction?.document?.id === document.id;
                        const matchesType =
                          r.type?.name === typeName ||
                          (!r.type && typeName === "Без категории");
                        return (
                          reconciliationAmount > 0 &&
                          isFromThisDoc &&
                          matchesType
                        );
                      })
                      .reduce((sum, r) => {
                        const reconciliationAmount =
                          (r.bankTransaction?.amount &&
                            r.crmTransaction?.amount) ||
                          0;
                        return sum + reconciliationAmount;
                      }, 0) || 0;

                  return (
                    <TableCell key={document.id} className="text-right">
                      {formatBalance(documentTypeIncome)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right">
                  {formatBalance(amount)}
                </TableCell>
              </TableRow>
            ))}

            {/* Expenses section */}
            <TableRow className="bg-red-50 dark:bg-red-950/10">
              <TableCell className="font-bold">Расходы за период</TableCell>
              {bankDocuments.map((document) => {
                const documentExpenses =
                  report.reconciliations
                    ?.filter((r) => {
                      const amount =
                        (r.bankTransaction?.amount &&
                          r.crmTransaction?.amount) ||
                        0;
                      const isFromThisDoc =
                        r.bankTransaction?.document?.id === document.id ||
                        r.crmTransaction?.document?.id === document.id;
                      return amount < 0 && isFromThisDoc;
                    })
                    .reduce((sum, r) => {
                      const amount =
                        (r.bankTransaction?.amount &&
                          r.crmTransaction?.amount) ||
                        0;
                      return sum + Math.abs(amount);
                    }, 0) || 0;

                return (
                  <TableCell key={document.id} className="text-right font-bold">
                    {formatBalance(documentExpenses)}
                  </TableCell>
                );
              })}
              <TableCell className="text-right font-bold">
                {formatBalance(totalExpenses)}
              </TableCell>
            </TableRow>

            {/* Detailed expenses breakdown */}
            {Object.entries(expensesByType).map(([typeName, amount]) => (
              <TableRow key={typeName}>
                <TableCell className="pl-8">• {typeName}</TableCell>
                {bankDocuments.map((document) => {
                  const documentTypeExpense =
                    report.reconciliations
                      ?.filter((r) => {
                        const reconciliationAmount =
                          (r.bankTransaction?.amount &&
                            r.crmTransaction?.amount) ||
                          0;
                        const isFromThisDoc =
                          r.bankTransaction?.document?.id === document.id ||
                          r.crmTransaction?.document?.id === document.id;
                        const matchesType =
                          r.type?.name === typeName ||
                          (!r.type && typeName === "Без категории");
                        return (
                          reconciliationAmount < 0 &&
                          isFromThisDoc &&
                          matchesType
                        );
                      })
                      .reduce((sum, r) => {
                        const reconciliationAmount =
                          (r.bankTransaction?.amount &&
                            r.crmTransaction?.amount) ||
                          0;
                        return sum + Math.abs(reconciliationAmount);
                      }, 0) || 0;

                  return (
                    <TableCell key={document.id} className="text-right">
                      {formatBalance(documentTypeExpense)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right">
                  {formatBalance(amount)}
                </TableCell>
              </TableRow>
            ))}

            {/* Ending balance */}
            <TableRow className="bg-gray-50 dark:bg-gray-900/50 border-t-2">
              <TableCell className="font-bold">На конец</TableCell>
              {bankDocuments.map((document) => {
                const documentEndBalance =
                  report.reconciliations
                    ?.filter((r) => {
                      const isFromThisDoc =
                        r.bankTransaction?.document?.id === document.id ||
                        r.crmTransaction?.document?.id === document.id;
                      return isFromThisDoc;
                    })
                    .reduce((sum, r) => {
                      const amount =
                        (r.bankTransaction?.amount &&
                          r.crmTransaction?.amount) ||
                        0;
                      return sum + amount;
                    }, 0) || 0;

                return (
                  <TableCell key={document.id} className="text-right font-bold">
                    {formatBalance(documentEndBalance)}
                  </TableCell>
                );
              })}
              <TableCell className="text-right font-bold">
                {formatBalance(totalEndBalance)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>Не сверено:</div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-64">Показатель</TableHead>
              {bankDocuments.map((document) => (
                <TableHead key={document.id} className="text-right">
                  {document.name}
                </TableHead>
              ))}
              {crmDocuments.map((document) => (
                <TableHead key={document.id} className="text-right">
                  {document.name}
                </TableHead>
              ))}
              <TableHead className="text-right">Итого</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Starting balance */}
            {/* <TableRow>
              <TableCell className="font-medium">На начало</TableCell>
              {bankDocuments.map((document) => (
                <TableCell key={document.id} className="text-right">
                  {formatBalance(document.balance)}
                </TableCell>
              ))}
              <TableCell className="text-right">
                {formatBalance(reportCashBalance)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatBalance(totalStartBalanceWithCash)}
              </TableCell>
            </TableRow> */}

            {/* Income section */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">Не сошлось</TableCell>
              {
                <TableCell className="text-right font-bold">
                  {formatBalance(totalNotMatchedBankDocuments)}
                </TableCell>
              }
              {
                <TableCell className="text-right font-bold">
                  {formatBalance(totalNotMatchedCrmDocuments)}
                </TableCell>
              }
              <TableCell className="text-right font-bold">
                {formatBalance(
                  totalNotMatchedBankDocuments + totalNotMatchedCrmDocuments,
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
