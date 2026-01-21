"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
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
import { Button } from "@/shared/ui/button";
import { Download } from "lucide-react";
import { type Bank } from "@/shared/models";
import * as XLSX from "xlsx";
import { extractDateFromPaymentPurpose } from "./lib/extract-date-from-payment-purpose";

const notAllowedTransactionTypeName = ["Пополнение наличными", "Дивиденды"];

export function ResultTable() {
  const params = useParams<{ id: string }>();

  const { data: report, isLoading } = api.reports.getById.useQuery({
    id: params.id,
  });

  const bankDocuments = Object.groupBy(
    report?.documents?.filter((document) => document.type === "bank") || [],
    (v) => v.bankName!,
  );

  const formatBalance = (balanceInKopecks: number) => {
    return balanceInKopecks.toLocaleString("ru-RU", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 2,
    });
  };

  const expensesByType: Record<string, Record<Bank, number>> = useMemo(() => {
    const calculatedExpense: Record<string, Record<Bank, number>> = {};

    report?.reconciliations?.forEach((reconciliation) => {
      if (
        !notAllowedTransactionTypeName.includes(reconciliation.type?.name || "")
      ) {
        const typeName = reconciliation.type?.name || "Без категории";

        if (reconciliation.bankTransaction && reconciliation.crmTransaction) {
          const amount =
            (reconciliation.bankTransaction.amount &&
              reconciliation.crmTransaction.amount) ||
            0;
          const bankName = reconciliation.bankTransaction.document
            ?.bankName as Exclude<Bank, "CRM">;

          if (amount < 0) {
            if (!calculatedExpense[typeName]) {
              calculatedExpense[typeName] = {} as Record<Bank, number>;
            }
            calculatedExpense[typeName][bankName] =
              (calculatedExpense[typeName][bankName] || 0) + amount / 100;
          }
        } else if (
          reconciliation.crmTransaction?.meta &&
          typeof reconciliation.crmTransaction.meta === "object" &&
          "byCash" in reconciliation.crmTransaction.meta &&
          reconciliation.crmTransaction.meta.byCash
        ) {
          if (reconciliation.crmTransaction.amount < 0) {
            if (!calculatedExpense[typeName]) {
              calculatedExpense[typeName] = {} as Record<Bank, number>;
            }
            calculatedExpense[typeName]["CRM"] =
              (calculatedExpense[typeName]["CRM"] || 0) +
              reconciliation.crmTransaction.amount / 100;
          }
        }
      }
    });
    return calculatedExpense;
  }, [report?.reconciliations]);

  const incomeByType: Record<string, Record<Bank, number>> = useMemo(() => {
    const calculatedIncome: Record<string, Record<Bank, number>> = {};
    report?.reconciliations?.forEach((reconciliation) => {
      if (
        !notAllowedTransactionTypeName.includes(reconciliation.type?.name || "")
      ) {
        const typeName = reconciliation.type?.name || "Без категории";

        if (reconciliation.bankTransaction && reconciliation.crmTransaction) {
          const amount =
            (reconciliation.bankTransaction.amount &&
              reconciliation.crmTransaction.amount) ||
            0;
          const bankName = reconciliation.bankTransaction.document
            ?.bankName as Exclude<Bank, "CRM">;

          if (amount > 0) {
            if (!calculatedIncome[typeName]) {
              calculatedIncome[typeName] = {} as Record<Bank, number>;
            }
            calculatedIncome[typeName][bankName] =
              (calculatedIncome[typeName][bankName] || 0) + amount / 100;
          }
        } else if (
          reconciliation.crmTransaction?.meta &&
          typeof reconciliation.crmTransaction.meta === "object" &&
          "byCash" in reconciliation.crmTransaction.meta &&
          reconciliation.crmTransaction.meta.byCash
        ) {
          if (reconciliation.crmTransaction.amount > 0) {
            if (!calculatedIncome[typeName]) {
              calculatedIncome[typeName] = {} as Record<Bank, number>;
            }
            calculatedIncome[typeName]["CRM"] =
              (calculatedIncome[typeName]["CRM"] || 0) +
              reconciliation.crmTransaction.amount / 100;
          }
        }
      }
    });
    return calculatedIncome;
  }, [report?.reconciliations]);

  const amountOfIncomeByType = useMemo(() => {
    return Object.values(incomeByType).reduce(
      (acc, val) => (acc += Object.values(val).reduce((a, v) => (a += v), 0)),
      0,
    );
  }, [incomeByType]);

  const amountOfExpenseByType = useMemo(() => {
    return Object.values(expensesByType).reduce(
      (acc, val) => (acc += Object.values(val).reduce((a, v) => (a += v), 0)),
      0,
    );
  }, [expensesByType]);

  // const cashIncome = useMemo(() => {
  //   return report?.reconciliations.reduce(
  //     (acc, rec) => {
  //       if (rec.crmTransaction) {
  //         const regex = /(пополн|налич)/i;
  //         if (regex.test(rec.type?.name || "")) {
  //           acc["CRM"] = (acc["CRM"] || 0) + (rec.crmTransaction.amount || 0);
  //         }
  //       }
  //       return acc;
  //     },
  //     {} as Record<Bank, number>,
  //   );
  // }, [report?.reconciliations]);

  const dividends = useMemo(() => {
    return report?.reconciliations.reduce(
      (acc, rec) => {
        if (rec.bankTransaction) {
          const regex = /(дивиденды|дивиден)/i;
          const bankName = rec.bankTransaction?.document?.bankName as Exclude<
            Bank,
            "CRM"
          >;
          if (regex.test(rec.type?.name || "")) {
            acc[bankName] =
              (acc[bankName] || 0) + (rec.bankTransaction?.amount || 0);
          }
        }
        return acc;
      },
      {} as Record<Bank, number>,
    );
  }, [report?.reconciliations]);

  const totalCashFlow = useMemo(() => {
    return (
      amountOfIncomeByType +
      amountOfExpenseByType +
      // Object.values(cashIncome || {}).reduce((acc, v) => (acc += v), 0) / 100 +
      Object.values(dividends || {}).reduce((acc, v) => (acc += v), 0) / 100
    );
  }, [amountOfIncomeByType, amountOfExpenseByType, dividends]);

  const totalBeginnigFlow = useMemo(() => {
    return Object.values(bankDocuments)
      .flatMap((v) => v)
      .reduce((acc, val) => (acc += val?.openingBalance || 0), 0);
  }, [bankDocuments]);

  const totalPreviousPeriodSales = useMemo(() => {
    return report?.reconciliations.reduce((acc, rec) => {
      if (
        rec.bankTransaction &&
        rec.bankTransaction.meta &&
        typeof rec.bankTransaction.meta === "object" &&
        "КНП" in rec.bankTransaction?.meta &&
        rec.bankTransaction.meta["КНП"] === "190"
      ) {
        const paymentPurpose = rec.bankTransaction.meta[
          "Назначение платежа"
        ] as string | undefined;
        const transactionDate = extractDateFromPaymentPurpose(paymentPurpose);

        if (transactionDate && transactionDate.isValid()) {
          const startDate = dayjs(report.startDate).startOf("day");
          const endDate = dayjs(report.endDate).endOf("day");
          const txDate = transactionDate.startOf("day");
          if (txDate.isBefore(startDate) && endDate.isAfter(txDate)) {
            acc += rec.bankTransaction.amount / 100;
          }
        }
      }
      return acc;
    }, 0);
  }, [report?.reconciliations, report?.startDate, report?.endDate]);

  // Продажи, не поступившие на расчетные счета по банкам
  const notMatchedSalesByBank = useMemo(() => {
    const result: Record<Bank, number> = {} as Record<Bank, number>;

    report?.reconciliations?.forEach((r) => {
      if (r.crmTransaction?.amount && !r.bankTransactionId && !r.type) {
        const amount =
          r.crmTransaction?.amount && r.crmTransaction?.amount > 0
            ? r.crmTransaction?.amount
            : 0;

        // Определяем банк из мета-данных CRM транзакции
        if (
          r.crmTransaction.meta &&
          typeof r.crmTransaction.meta === "object" &&
          "bank" in r.crmTransaction.meta
        ) {
          const bank = r.crmTransaction.meta.bank as Bank;
          result[bank] = (result[bank] || 0) + amount / 100;
        } else if (
          r.crmTransaction.meta &&
          typeof r.crmTransaction.meta === "object" &&
          "byCash" in r.crmTransaction.meta &&
          r.crmTransaction.meta.byCash
        ) {
          result["CRM"] = (result["CRM"] || 0) + amount / 100;
        }
      }
    });

    return result;
  }, [report?.reconciliations]);

  // Движение денежных средств по банкам
  const cashFlowByBank = useMemo(() => {
    const result: Record<Bank, number> = {} as Record<Bank, number>;
    const bankNames = Object.keys(bankDocuments);

    bankNames.forEach((bankName) => {
      const incomeForBank = Object.values(incomeByType).reduce((acc, val) => {
        acc += val[bankName as Bank] || 0;
        return acc;
      }, 0);

      const expenseForBank = Object.values(expensesByType).reduce(
        (acc, val) => {
          acc += val[bankName as Bank] || 0;
          return acc;
        },
        0,
      );

      const dividendsForBank = (dividends?.[bankName as Bank] || 0) / 100;

      result[bankName as Bank] =
        incomeForBank + expenseForBank + dividendsForBank;
    });

    // CRM (Наличные)
    const crmIncome = Object.values(incomeByType).reduce((acc, val) => {
      acc += val["CRM"] || 0;
      return acc;
    }, 0);

    const crmExpense = Object.values(expensesByType).reduce((acc, val) => {
      acc += val["CRM"] || 0;
      return acc;
    }, 0);

    result["CRM"] = crmIncome + crmExpense;

    return result;
  }, [bankDocuments, incomeByType, expensesByType, dividends]);

  // На конец периода по банкам
  const endPeriodBalanceByBank = useMemo(() => {
    const result: Record<Bank, number> = {} as Record<Bank, number>;

    Object.entries(bankDocuments).forEach(([bankName, documents]) => {
      const openingBalance = documents?.reduce(
        (acc, val) => (acc += val.openingBalance || 0),
        0,
      ) || 0;
      const cashFlow = cashFlowByBank[bankName as Bank] || 0;
      result[bankName as Bank] = openingBalance + cashFlow;
    });

    // CRM (Наличные) - только движение средств, без начального баланса
    result["CRM"] = cashFlowByBank["CRM"] || 0;

    return result;
  }, [bankDocuments, cashFlowByBank]);

  // Продажи за период по банкам
  const salesByBankForPeriod = useMemo(() => {
    const result: Record<Bank, number> = {} as Record<Bank, number>;
    const bankNames = Object.keys(bankDocuments);

    bankNames.forEach((bankName) => {
      const incomeForBank = Object.values(incomeByType).reduce((acc, val) => {
        acc += val[bankName as Bank] || 0;
        return acc;
      }, 0);
      const notMatched = notMatchedSalesByBank[bankName as Bank] || 0;
      result[bankName as Bank] = incomeForBank + notMatched;
    });

    // CRM (Наличные)
    const crmIncome = Object.values(incomeByType).reduce((acc, val) => {
      acc += val["CRM"] || 0;
      return acc;
    }, 0);
    const crmNotMatched = notMatchedSalesByBank["CRM"] || 0;
    result["CRM"] = crmIncome + crmNotMatched;

    return result;
  }, [bankDocuments, incomeByType, notMatchedSalesByBank]);

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
    (report.reconciliations
      ?.filter((r) => {
        return r.crmTransaction?.amount && !r.bankTransactionId && !r.type;
      })
      .reduce((sum, r) => {
        const amount =
          r.crmTransaction?.amount && r.crmTransaction?.amount > 0
            ? r.crmTransaction?.amount
            : 0;
        return sum + amount;
      }, 0) || 0) / 100;

  const formatBalanceForExcel = (amount: number) => {
    return amount.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const exportToExcel = () => {
    if (!report) return;

    const bankNames = Object.keys(bankDocuments);
    const headers = ["Наименование", "Итого", ...bankNames, "Наличные"];

    const rows: (string | number)[][] = [headers];

    // Начало периода
    const openingBalanceRow = ["На начало периода"];
    let totalOpening = 0;
    bankNames.forEach((bankName) => {
      const bankDocs = bankDocuments[bankName] || [];
      const bankTotal = bankDocs.reduce(
        (acc, doc) => acc + (doc.openingBalance || 0),
        0,
      );
      openingBalanceRow.push(formatBalanceForExcel(bankTotal));
      totalOpening += bankTotal;
    });
    openingBalanceRow.push(""); // Наличные
    openingBalanceRow[1] = formatBalanceForExcel(totalOpening); // Итого
    rows.push(openingBalanceRow);

    // Поступления
    Object.entries(incomeByType).forEach(([typeName, amounts]) => {
      const row = [
        `__${typeName}__`,
        Object.values(amounts).reduce((acc, v) => (acc += Math.abs(v)), 0),
      ];
      let total = 0;
      bankNames.forEach((bankName) => {
        const amount = amounts[bankName as Bank] || 0;
        row.push(amount ? formatBalanceForExcel(Math.abs(amount)) : "--");
        if (amount) total += Math.abs(amount);
      });
      const crmAmount = amounts["CRM"] || 0;
      row.push(crmAmount ? formatBalanceForExcel(Math.abs(crmAmount)) : "--");
      if (crmAmount) total += Math.abs(crmAmount);
      row[1] = formatBalanceForExcel(total); // Итого
      rows.push(row);
    });

    // Итого поступлений
    const incomeTotalRow = ["Итого поступлений"];
    incomeTotalRow.push(formatBalanceForExcel(amountOfIncomeByType));
    bankNames.forEach(() => incomeTotalRow.push(""));
    incomeTotalRow.push("");
    rows.push(incomeTotalRow);

    // Выбытия
    Object.entries(expensesByType).forEach(([typeName, amounts]) => {
      const row = [
        `__${typeName}__`,
        Object.values(amounts).reduce((acc, v) => (acc += v), 0),
      ];
      let total = 0;
      bankNames.forEach((bankName) => {
        const amount = amounts[bankName as Bank] || 0;
        row.push(amount ? formatBalanceForExcel(Math.abs(amount)) : "--");
        if (amount) total += Math.abs(amount);
      });
      const crmAmount = amounts["CRM"] || 0;
      row.push(crmAmount ? formatBalanceForExcel(Math.abs(crmAmount)) : "--");
      if (crmAmount) total += Math.abs(crmAmount);
      row[1] = formatBalanceForExcel(total); // Итого
      rows.push(row);
    });

    // Итого выбытий
    const expenseTotalRow = ["Итого выбытий"];
    expenseTotalRow.push(formatBalanceForExcel(amountOfExpenseByType));
    bankNames.forEach(() => expenseTotalRow.push(""));
    expenseTotalRow.push("");
    rows.push(expenseTotalRow);

    // Итого кассовая прибыль/убыток
    const profitRow = ["Итого кассовая прибыль/убыток"];
    profitRow.push(
      formatBalanceForExcel(amountOfIncomeByType + amountOfExpenseByType),
    );
    bankNames.forEach(() => profitRow.push(""));
    profitRow.push("");
    rows.push(profitRow);

    // Дивиденды
    if (dividends && Object.keys(dividends).length > 0) {
      const dividendsRow = ["Дивиденды"];
      const dividendsTotal = Object.values(dividends).reduce(
        (acc, v) => acc + v,
        0,
      );
      dividendsRow.push(formatBalanceForExcel(dividendsTotal / 100));
      bankNames.forEach((bankName) => {
        const amount = dividends[bankName as Bank] || 0;
        dividendsRow.push(amount ? formatBalanceForExcel(amount / 100) : "--");
      });
      dividendsRow.push("--");
      rows.push(dividendsRow);
    }

    // Итого движение денежных средств
    const cashFlowRow = ["Итого движение денежных средств"];
    cashFlowRow.push(formatBalanceForExcel(totalCashFlow));
    bankNames.forEach((bankName) => {
      cashFlowRow.push(formatBalanceForExcel(cashFlowByBank[bankName as Bank] || 0));
    });
    cashFlowRow.push(formatBalanceForExcel(cashFlowByBank["CRM"] || 0));
    rows.push(cashFlowRow);

    // На конец периода
    const endPeriodRow = ["На конец периода"];
    const endPeriodTotal = totalBeginnigFlow + totalCashFlow;
    endPeriodRow.push(formatBalanceForExcel(endPeriodTotal));
    bankNames.forEach((bankName) => {
      endPeriodRow.push(formatBalanceForExcel(endPeriodBalanceByBank[bankName as Bank] || 0));
    });
    endPeriodRow.push(formatBalanceForExcel(endPeriodBalanceByBank["CRM"] || 0));
    rows.push(endPeriodRow);

    // Продажи, не поступившие на расчетные счета
    const notMatchedRow = ["Продажи, не поступившие на расчетные счета"];
    notMatchedRow.push(formatBalanceForExcel(totalNotMatchedCrmDocuments));
    bankNames.forEach((bankName) => {
      const amount = notMatchedSalesByBank[bankName as Bank] || 0;
      notMatchedRow.push(amount ? formatBalanceForExcel(amount) : "--");
    });
    notMatchedRow.push(
      notMatchedSalesByBank["CRM"]
        ? formatBalanceForExcel(notMatchedSalesByBank["CRM"])
        : "--",
    );
    rows.push(notMatchedRow);

    // Продажи за период
    const salesRow = ["Продажи за период"];
    const salesTotal = totalNotMatchedCrmDocuments + amountOfIncomeByType;
    salesRow.push(formatBalanceForExcel(salesTotal));
    bankNames.forEach((bankName) => {
      salesRow.push(formatBalanceForExcel(salesByBankForPeriod[bankName as Bank] || 0));
    });
    salesRow.push(formatBalanceForExcel(salesByBankForPeriod["CRM"] || 0));
    rows.push(salesRow);

    // Создаем workbook
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Отчет");

    // Устанавливаем ширину колонок
    const colWidths = [
      { wch: 40 }, // Наименование
      { wch: 15 }, // Итого
      ...bankNames.map(() => ({ wch: 15 })), // Банки
      { wch: 15 }, // Наличные
    ];
    ws["!cols"] = colWidths;

    // Скачиваем файл
    const fileName = `Отчет_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-end">
        <Button onClick={exportToExcel} size="sm" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Экспорт в Excel
        </Button>
      </div>
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
              {Object.entries(bankDocuments).map(
                ([bankName, documents], id) => (
                  <TableCell
                    key={`${bankName}-${id}`}
                    className="text-right font-bold"
                  >
                    {formatBalance(
                      documents?.reduce(
                        (acc, val) => (acc += val.openingBalance || 0),
                        0,
                      ) || 0,
                    )}
                  </TableCell>
                ),
              )}
            </TableRow>

            {/* ПОСТУПЛЕНИЯ */}
            {Object.entries(incomeByType).map(([typeName, val], id) => (
              <TableRow
                className="bg-green-50 dark:bg-green-950/10"
                key={typeName + id}
              >
                <TableCell>__{typeName}__</TableCell>
                <TableCell className="text-right">
                  {Object.values(val).reduce(
                    (acc, v) => (acc += Math.abs(v)),
                    0,
                  )}
                </TableCell>
                {Object.keys(bankDocuments).map((bankName, id) => (
                  <TableCell
                    key={`${bankName}-income-${id}`}
                    className="text-right"
                  >
                    {val[bankName as Bank] || "--"}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {val["CRM"] || "--"}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">Итого поступлений</TableCell>
              <TableCell className="text-right font-bold">
                {formatBalance(amountOfIncomeByType)}
              </TableCell>
              {Object.keys(bankDocuments).map((bankName, id) => (
                <TableCell
                  key={`${bankName}-total-income-${id}`}
                  className="text-right"
                >
                  {Object.values(incomeByType).reduce((acc, val) => {
                    acc += val[bankName as Bank] || 0;
                    return acc;
                  }, 0)}
                </TableCell>
              ))}
              <TableCell className="text-right">
                {Object.values(incomeByType).reduce((acc, val) => {
                  acc += val["CRM"] || 0;
                  return acc;
                }, 0)}
              </TableCell>
            </TableRow>

            {/* ВЫБЫТИЯ */}
            {Object.entries(expensesByType).map(([typeName, val], id) => (
              <TableRow
                className="bg-green-50 dark:bg-green-950/10"
                key={typeName + id}
              >
                <TableCell>__{typeName}__</TableCell>
                <TableCell className="text-right">
                  {Object.values(val).reduce((acc, v) => (acc += v), 0)}
                </TableCell>
                {Object.keys(bankDocuments).map((bankName, id) => (
                  <TableCell
                    key={`${bankName}-income-${id}`}
                    className="text-right"
                  >
                    {val[bankName as Bank] || "--"}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {val["CRM"] || "--"}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">Итого выбытий</TableCell>
              <TableCell className="text-right font-bold">
                {formatBalance(amountOfExpenseByType)}
              </TableCell>
              {Object.keys(bankDocuments).map((bankName, id) => (
                <TableCell
                  key={`${bankName}-total-income-${id}`}
                  className="text-right"
                >
                  {Object.values(expensesByType).reduce((acc, val) => {
                    acc += val[bankName as Bank] || 0;
                    return acc;
                  }, 0)}
                </TableCell>
              ))}
              <TableCell className="text-right">
                {Object.values(expensesByType).reduce((acc, val) => {
                  acc += val["CRM"] || 0;
                  return acc;
                }, 0)}
              </TableCell>
            </TableRow>

            {/* ИТОГО ПОСТУПЛЕНИЯ И УБЫТИЯ */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">
                Итого кассовая прибыль/убыток
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatBalance(amountOfIncomeByType + amountOfExpenseByType)}
              </TableCell>
              {Object.keys(bankDocuments).map((bankName, id) => (
                <TableCell
                  key={`${bankName}-total-income-${id}`}
                  className="text-right"
                >
                  {Object.values(incomeByType).reduce((acc, val) => {
                    acc += val[bankName as Bank] || 0;
                    return acc;
                  }, 0) +
                    Object.values(expensesByType).reduce((acc, val) => {
                      acc += val[bankName as Bank] || 0;
                      return acc;
                    }, 0)}
                </TableCell>
              ))}
              <TableCell className="text-right">
                {Object.values(incomeByType).reduce((acc, val) => {
                  acc += val["CRM"] || 0;
                  return acc;
                }, 0) +
                  Object.values(expensesByType).reduce((acc, val) => {
                    acc += val["CRM"] || 0;
                    return acc;
                  }, 0)}
              </TableCell>
            </TableRow>

            {/* ПОПОЛНЕНИЯ НАЛИЧНЫМИ */}
            {/* {cashIncome && (
              <TableRow className="bg-green-50 dark:bg-green-950/10">
                <TableCell>Пополнения наличными</TableCell>
                <TableCell className="text-right">
                  {formatBalance(
                    Object.values(cashIncome).reduce(
                      (acc, v) => (acc += v),
                      0,
                    ) / 100,
                  )}
                </TableCell>
                {Object.values(cashIncome).length ? (
                  <TableCell className="text-right font-bold">--</TableCell>
                ) : (
                  <TableCell className="text-right font-bold"></TableCell>
                )}
                <TableCell className="text-right font-bold">--</TableCell>
                {Object.entries(cashIncome).map(([bankName, amount], id) => (
                  <TableCell
                    key={`${bankName}-cash-income-${id}`}
                    className="text-right"
                  >
                    {formatBalance(amount / 100)}
                  </TableCell>
                ))}
              </TableRow>
            )} */}

            {/* ДИВИДЕНДЫ */}
            {dividends && (
              <TableRow className="bg-green-50 dark:bg-green-950/10">
                <TableCell>Дивиденды</TableCell>
                <TableCell className="text-right">
                  {formatBalance(
                    Object.values(dividends).reduce((acc, v) => (acc += v), 0) /
                      100,
                  )}
                </TableCell>
                {Object.entries(dividends).map(([bankName, amount], id) => (
                  <TableCell
                    key={`${bankName}-dividends-${id}`}
                    className="text-right"
                  >
                    {formatBalance(amount / 100)}
                  </TableCell>
                ))}
                {Object.values(dividends).length ? (
                  <TableCell className="text-right font-bold">--</TableCell>
                ) : (
                  <TableCell className="text-right font-bold"></TableCell>
                )}
              </TableRow>
            )}

            {/* Итого движение денежных средств */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">
                Итого движение денежных средств
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatBalance(totalCashFlow)}
              </TableCell>
              {Object.keys(bankDocuments).map((bankName, id) => (
                <TableCell
                  key={`${bankName}-total-cash-flow-${id}`}
                  className="text-right"
                >
                  {formatBalance(cashFlowByBank[bankName as Bank] || 0)}
                </TableCell>
              ))}
              <TableCell className="text-right">
                {formatBalance(cashFlowByBank["CRM"] || 0)}
              </TableCell>
            </TableRow>

            {/* На конец периода */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">На конец периода</TableCell>
              <TableCell className="text-right font-bold">
                {formatBalance(totalBeginnigFlow + totalCashFlow)}
              </TableCell>
              {Object.keys(bankDocuments).map((bankName, id) => (
                <TableCell
                  key={`${bankName}-end-period-${id}`}
                  className="text-right font-bold"
                >
                  {formatBalance(endPeriodBalanceByBank[bankName as Bank] || 0)}
                </TableCell>
              ))}
              <TableCell className="text-right font-bold">
                {formatBalance(endPeriodBalanceByBank["CRM"] || 0)}
              </TableCell>
            </TableRow>

            {/* Продажи, не поступившие на расчетные счета */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">
                Продажи, не поступившие на расчетные счета
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatBalance(totalNotMatchedCrmDocuments)}
              </TableCell>
              {Object.keys(bankDocuments).map((bankName, id) => (
                <TableCell
                  key={`${bankName}-not-matched-${id}`}
                  className="text-right font-bold"
                >
                  {notMatchedSalesByBank[bankName as Bank]
                    ? formatBalance(notMatchedSalesByBank[bankName as Bank])
                    : "--"}
                </TableCell>
              ))}
              <TableCell className="text-right font-bold">
                {notMatchedSalesByBank["CRM"]
                  ? formatBalance(notMatchedSalesByBank["CRM"])
                  : "--"}
              </TableCell>
            </TableRow>

            {/* Продажи, поступившие за предыдущие периоды */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">
                Продажи, поступившие за предыдущие периоды
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatBalance(totalPreviousPeriodSales || 0)}
              </TableCell>
              <TableCell className="font-bold"></TableCell>
            </TableRow>

            {/* Продажи за период */}
            <TableRow className="bg-green-50 dark:bg-green-950/10">
              <TableCell className="font-bold">Продажи за период</TableCell>
              <TableCell className="text-right font-bold">
                {formatBalance(
                  totalNotMatchedCrmDocuments + amountOfIncomeByType,
                )}
              </TableCell>
              {Object.keys(bankDocuments).map((bankName, id) => (
                <TableCell
                  key={`${bankName}-sales-period-${id}`}
                  className="text-right font-bold"
                >
                  {formatBalance(salesByBankForPeriod[bankName as Bank] || 0)}
                </TableCell>
              ))}
              <TableCell className="text-right font-bold">
                {formatBalance(salesByBankForPeriod["CRM"] || 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
