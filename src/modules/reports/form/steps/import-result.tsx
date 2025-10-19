"use client";

import { useMemo } from 'react';
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
import { type Bank } from '@/shared/models';

const notAllowedTransactionTypeName = ['Пополнение наличными', 'Дивиденды'];

export function ResultTable() {
  const params = useParams<{ id: string }>();

  const { data: report, isLoading } = api.reports.getById.useQuery({
    id: params.id,
  });

  const bankDocuments =
    Object.groupBy(
      report?.documents?.filter((document) => document.type === "bank") || [],
      v => v.bankName!
    );

  const formatBalance = (balanceInKopecks: number) => {
    return (balanceInKopecks).toLocaleString("ru-RU", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 2,
    });
  };

  const expensesByType: Record<string, Record<Bank, number>> = useMemo(() => {
    const calculatedExpense: Record<string, Record<Bank, number>> = {};

    report?.reconciliations?.forEach((reconciliation) => {
      if (!notAllowedTransactionTypeName.includes(reconciliation.type?.name || '')) {
        const typeName = reconciliation.type?.name || "Без категории";

        if (reconciliation.bankTransaction && reconciliation.crmTransaction) {
          const amount =
            (reconciliation.bankTransaction.amount &&
              reconciliation.crmTransaction.amount) ||
            0; 
          const bankName = reconciliation.bankTransaction.document?.bankName as Exclude<Bank, 'CRM'>;

          if (amount < 0) {
            if (!calculatedExpense[typeName]) {
              calculatedExpense[typeName] = {} as Record<Bank, number>
            }
            calculatedExpense[typeName][bankName] =
              (calculatedExpense[typeName][bankName] || 0) + (amount / 100);
          }
        } else if (reconciliation.crmTransaction?.meta && typeof reconciliation.crmTransaction.meta === 'object' && 'byCash' in reconciliation.crmTransaction.meta && reconciliation.crmTransaction.meta.byCash) {
          if (reconciliation.crmTransaction.amount < 0) {
            if (!calculatedExpense[typeName]) {
              calculatedExpense[typeName] = {} as Record<Bank, number>
            }
            calculatedExpense[typeName]['CRM'] =
              (calculatedExpense[typeName]['CRM'] || 0) + (reconciliation.crmTransaction.amount / 100);
          }
        }
      }
    });
    return calculatedExpense;
  }, [report?.reconciliations]);

  const incomeByType: Record<string, Record<Bank, number>> = useMemo(() => {
    const calculatedIncome: Record<string, Record<Bank, number>> = {};
    report?.reconciliations?.forEach((reconciliation) => {
      if (!notAllowedTransactionTypeName.includes(reconciliation.type?.name || '')) {
        const typeName = reconciliation.type?.name || "Без категории";

        if (reconciliation.bankTransaction && reconciliation.crmTransaction) {
          const amount =
            (reconciliation.bankTransaction.amount &&
              reconciliation.crmTransaction.amount) ||
            0; 
          const bankName = reconciliation.bankTransaction.document?.bankName as Exclude<Bank, 'CRM'>;

          if (amount > 0) {
            if (!calculatedIncome[typeName]) {
              calculatedIncome[typeName] = {} as Record<Bank, number>
            }
            calculatedIncome[typeName][bankName] = (calculatedIncome[typeName][bankName] || 0) + (amount / 100);
          }
        } else if (reconciliation.crmTransaction?.meta && typeof reconciliation.crmTransaction.meta === 'object' && 'byCash' in reconciliation.crmTransaction.meta && reconciliation.crmTransaction.meta.byCash) {
          if (reconciliation.crmTransaction.amount > 0) {
            if (!calculatedIncome[typeName]) {
              calculatedIncome[typeName] = {} as Record<Bank, number>
            }
            calculatedIncome[typeName]['CRM'] = 
              (calculatedIncome[typeName]['CRM'] || 0) + (reconciliation.crmTransaction.amount / 100);
          }
        }
      }
    });
    return calculatedIncome;
  }, [report?.reconciliations]);

  const amountOfIncomeByType = useMemo(() => {
    return Object.values(incomeByType).reduce((acc, val) => acc += Object.values(val).reduce((a,v) => a += v, 0), 0)
  }, [incomeByType]);

  const amountOfExpenseByType = useMemo(() => {
    return Object.values(expensesByType).reduce((acc, val) => acc += Object.values(val).reduce((a,v) => a += v, 0), 0)
  }, [expensesByType]);

  const cashIncome = useMemo(() => {
    return report?.reconciliations.reduce((acc, rec) => {
      if (rec.bankTransaction) {
        const bankName = rec.bankTransaction.document?.bankName as Exclude<Bank, 'CRM'>
        if (rec.type?.name === 'Пополнение наличными') {
          acc[bankName] = (acc[bankName] || 0) + (rec.bankTransaction.amount || 0)
        }
      }
      return acc
    }, {} as Record<Bank, number>)
  }, [report?.reconciliations])

  const dividends = useMemo(() => {
    return report?.reconciliations.reduce((acc, rec) => {
      if (rec.bankTransaction) {
        const bankName = rec.bankTransaction?.document?.bankName as Exclude<Bank, 'CRM'>
        if (rec.type?.name === 'Дивиденды') {
          acc[bankName] = (acc[bankName] || 0) + (rec.bankTransaction?.amount || 0)
        }
      }
      return acc
    }, {} as Record<Bank, number>)
  }, [report?.reconciliations])

  const totalCashFlow = useMemo(() => {
    return (amountOfIncomeByType + amountOfExpenseByType) + 
    (Object.values(cashIncome || {}).reduce((acc, v) => acc += v, 0) / 100) + 
    (Object.values(dividends || {}).reduce((acc, v) => acc += v, 0) / 100)
  }, [amountOfIncomeByType, amountOfExpenseByType, cashIncome, dividends]);

  const totalBeginnigFlow = useMemo(() => {
    return Object.values(bankDocuments).flatMap(v => v).reduce((acc, val) => acc += (val?.openingBalance || 0), 0)
  }, [bankDocuments])

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

  const crmDocuments =
    report.documents?.filter((document) => document.type === "crm") || [];

  // const totalStartBalance = bankDocuments.reduce(
  //   (sum, doc) => sum + doc.balance,
  //   0,
  // );

  // Cash balance from report (converted from kopecks to display format)
  const reportCashBalance = report.cashBalance || 0;

  // Total starting balance including cash
  // const totalStartBalanceWithCash = totalStartBalance + reportCashBalance;

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

  return (
    <div className="space-y-6 p-6">
      {/* Detailed Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-64">Наименование</TableHead>
              <TableHead className="text-right">Итого</TableHead>
              {Object.keys(bankDocuments).map((documentName, id) => (
                <TableHead key={id} className="text-right">
                  {documentName}
                </TableHead>
              ))}
              <TableHead className="text-right">Наличные</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* НАЧАЛО ПЕРИОДА */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">На начало периода</TableCell>
              <TableCell className="text-right font-bold">
                {formatBalance(totalBeginnigFlow)}
              </TableCell>
              {Object.entries(bankDocuments).map(([bankName, documents], id) => (
                <TableCell key={`${bankName}-${id}`} className="text-right font-bold">
                  {formatBalance((documents?.reduce((acc, val) => acc += val.openingBalance || 0, 0) || 0))}
                </TableCell>
              ))}
            </TableRow>

            {/* ПОСТУПЛЕНИЯ */}
            {Object.entries(incomeByType).map(([typeName, val], id) => (
              <TableRow className="bg-green-50 dark:bg-green-950/10" key={typeName+id}>
                <TableCell>__{typeName}__</TableCell>
                <TableCell className="text-right">{Object.values(val).reduce((acc, v) => acc += Math.abs(v), 0)}</TableCell>
                {Object.keys(bankDocuments).map((bankName, id) => (
                  <TableCell key={`${bankName}-income-${id}`} className="text-right">{val[bankName as Bank]}</TableCell>
                ))}
                <TableCell className="text-right">{val['CRM'] || '--'}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">Итого поступлений</TableCell>
              <TableCell className="text-right font-bold">{formatBalance(amountOfIncomeByType)}</TableCell>
              <TableCell className="font-bold"></TableCell>
            </TableRow>

            {/* ВЫБЫТИЯ */}
            {Object.entries(expensesByType).map(([typeName, val], id) => (
              <TableRow className="bg-green-50 dark:bg-green-950/10" key={typeName+id}>
                <TableCell>__{typeName}__</TableCell>
                <TableCell className="text-right">{Object.values(val).reduce((acc, v) => acc += v, 0)}</TableCell>
                {Object.keys(bankDocuments).map((bankName, id) => (
                  <TableCell key={`${bankName}-income-${id}`} className="text-right">{val[bankName as Bank] || '--'}</TableCell>
                ))}
                <TableCell className="text-right">{val['CRM'] || '--'}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">Итого выбытий</TableCell>
              <TableCell className="text-right font-bold">{formatBalance(amountOfExpenseByType)}</TableCell>
              <TableCell className="font-bold"></TableCell>
            </TableRow>

            {/* ИТОГО ПОСТУПЛЕНИЯ И УБЫТИЯ */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">Итого кассовая прибыль/убыток</TableCell>
              <TableCell className="text-right font-bold">{formatBalance(amountOfIncomeByType + amountOfExpenseByType)}</TableCell>
              <TableCell className="font-bold"></TableCell>
            </TableRow>

            {/* ПОПОЛНЕНИЯ НАЛИЧНЫМИ */}
            {cashIncome && (
              <TableRow className="bg-green-50 dark:bg-green-950/10">
                <TableCell>Пополнения наличными</TableCell>
                <TableCell className="text-right">{formatBalance(
                  Object.values(cashIncome).reduce((acc, v) => acc += v, 0) / 100
                )}</TableCell>
                {Object.entries(cashIncome).map(([bankName, amount], id) => (
                  <TableCell key={`${bankName}-cash-income-${id}`} className="text-right">
                    {formatBalance(amount / 100)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">--</TableCell>
              </TableRow>)
            }

            {/* ДИВИДЕНДЫ */}
            {dividends && (
              <TableRow className="bg-green-50 dark:bg-green-950/10">
                <TableCell>Дивиденды</TableCell>
                <TableCell className="text-right">{formatBalance(
                  Object.values(dividends).reduce((acc, v) => acc += v, 0) / 100
                )}</TableCell>
                {Object.entries(dividends).map(([bankName, amount], id) => (
                  <TableCell key={`${bankName}-dividends-${id}`} className="text-right">
                    {formatBalance(amount / 100)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">--</TableCell>
              </TableRow>)
            }

            {/* Итого движение денежных средств */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">Итого движение денежных средств</TableCell>
              <TableCell className="text-right font-bold">{formatBalance(totalCashFlow)}</TableCell>
              <TableCell className="text-right font-bold"></TableCell>
            </TableRow>

            {/* На конец периода */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">На конец периода</TableCell>
              <TableCell className="text-right font-bold">{formatBalance(totalBeginnigFlow + totalCashFlow)}</TableCell>
              <TableCell className="font-bold"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
