import { z } from "zod";
import { api } from "@/shared/lib/trpc/client";
import { cn } from "@/shared/lib/cn";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { DollarSign } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Prisma } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { toast } from "sonner";
import { ReconciliationRowV2 } from "./components/ReconciliationRowV2";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { extractDateFromPaymentPurpose } from "./lib/extract-date-from-payment-purpose";
import { formatBalance } from "./lib/format-balance";
import { ReconciliationDetailModal } from "./modals/ReconciliationDetailModal";
import { CreateReconciliationModal } from "./modals/CreateReconciliationModal";

dayjs.extend(customParseFormat);

const reconciliationWithRelations = {
  include: {
    bankTransaction: true,
    crmTransaction: true,
    type: true,
  },
};

export type ReconciliationWithRelations = Prisma.ReconciliationGetPayload<
  typeof reconciliationWithRelations
>;

export type TransactionType = "Kaspi" | "Halyk" | "CRM" | "Cash";

export const formSchema = z.object({
  addedBy: z
    .string({ message: "Обязательное поле" })
    .min(1, "Обязательное поле"),
  purpose: z
    .string({ message: "Обязательное поле" })
    .min(1, "Обязательное поле"),
});

export const cashTransactionFormSchema = z.object({
  amount: z
    .number({ message: "Обязательное поле" })
    .positive("Сумма должна быть положительной"),
  addedBy: z
    .string({ message: "Обязательное поле" })
    .min(1, "Обязательное поле"),
  purpose: z
    .string({ message: "Обязательное поле" })
    .min(1, "Обязательное поле"),
});

type CashTransactionFormType = z.infer<typeof cashTransactionFormSchema>;

type SchemaType = z.infer<typeof formSchema>;

// Компонент гармошки для транзакций КНП === 190
const Knp190Accordion = ({
  knpTransaction,
  salesReportTransactions,
  transactionTypes,
  updateReconciliation,
  isUpdatingReconciliation,
  handleViewReconciliations,
  handleCreateReconcile,
  handleReconciliationCreate,
  notReconciliatedCrmTransactions,
  pickedCrmTransactions,
  amountsMatch,
}: {
  knpTransaction: ReconciliationWithRelations;
  salesReportTransactions: ReconciliationWithRelations[];
  transactionTypes: any;
  updateReconciliation: any;
  isUpdatingReconciliation: boolean;
  handleViewReconciliations: any;
  handleCreateReconcile: any;
  handleReconciliationCreate: any;
  notReconciliatedCrmTransactions: ReconciliationWithRelations[];
  pickedCrmTransactions: string[];
  amountsMatch: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // amount в Transaction хранится в копейках (Int)
  const knpAmount = (knpTransaction.bankTransaction?.amount || 0) / 100;
  const salesReportAmount = salesReportTransactions.reduce(
    (sum: number, rec: ReconciliationWithRelations) => {
      return sum + (rec.bankTransaction?.amount || 0) / 100;
    },
    0,
  );

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div
        className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <div className="w-1/3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(
                    knpTransaction.bankTransaction?.date || new Date(),
                  )}
                </p>
                <p className="font-bold text-lg">
                  {formatBalance(knpTransaction.bankTransaction?.amount || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  КНП: 190
                </p>
              </div>
              {!amountsMatch && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Суммы не совпадают: КНП 190 ={" "}
                    {formatBalance(knpAmount * 100)}, Отчет по продажам ={" "}
                    {formatBalance(salesReportAmount * 100)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Раскрывающийся контент - транзакции из sales_report */}
      {isExpanded && (
        <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Транзакции из Отчета по продажам:
            </p>
            <div className="space-y-2">
              {salesReportTransactions.length > 0 ? (
                salesReportTransactions.map((rec) => (
                  <ReconciliationRowV2
                    key={rec.id}
                    reconciliations={[rec]}
                    transactionTypes={transactionTypes}
                    updateReconciliation={updateReconciliation}
                    isUpdatingReconciliation={isUpdatingReconciliation}
                    handleViewReconciliations={handleViewReconciliations}
                    handleCreateReconcile={handleCreateReconcile}
                    handleReconciliationCreate={handleReconciliationCreate}
                    notReconciliatedCrmTransactions={
                      notReconciliatedCrmTransactions
                    }
                    pickedCrmTransactions={pickedCrmTransactions}
                    currentTransactionFilter="Kaspi"
                    type="bank"
                    isMini={true}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Нет соответствующих транзакций из Отчета по продажам
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ImportSales = () => {
  const params = useParams<{ id: string }>();
  const [isModalReconciliationDetailOpen, setIsModalReconciliationDetailOpen] =
    useState(false);
  const [
    isModalReconciliationsDetailOpen,
    setIsModalReconciliationsDetailOpen,
  ] = useState(false);
  const [isModalReconciliationCreateOpen, setIsModalReconciliationCreateOpen] =
    useState(false);
  const [isModalReconcileCreateOpen, setIsModalReconcileCreateOpen] =
    useState(false);
  const [isModalCashCreateOpen, setIsModalCashCreateOpen] = useState(false);
  const [currentBankReconciliation, setCurrentBankReconciliation] =
    useState<ReconciliationWithRelations>();
  const [currentReconciliations, setCurrentReconciliations] = useState<
    ReconciliationWithRelations[]
  >([]);
  const [pickedCrmTransactions, setPickedCrmTransactions] = useState<string[]>(
    [],
  );
  const [currentTransactionFilter, setCurrentTransactionFilter] =
    useState<TransactionType>("Kaspi");
  const [reconciliationStatusFilter, setReconciliationStatusFilter] = useState<
    "all" | "reconciled" | "unreconciled"
  >("all");

  const { data: report, isLoading } = api.reports.getById.useQuery({
    id: params.id,
  });

  const {
    mutateAsync: updateReconciliation,
    isPending: isUpdatingReconciliation,
  } = api.reconciliation.updateReconcile.useMutation({
    onSuccess: () => {
      utils.reports.getById.invalidate({ id: params.id });
    },
  });

  const {
    mutateAsync: updateBankReconciliation,
    isPending: isUpdatingBankReconciliation,
  } = api.reconciliation.updateBankReconcile.useMutation({
    onSuccess: () => {
      utils.reports.getById.invalidate({ id: params.id });
    },
  });

  const { data: transactionTypes } = api.transactionType.getAll.useQuery();

  const {
    mutateAsync: createTransaction,
    isPending: isPendingCreateTransaction,
  } = api.transaction.create.useMutation({
    onSuccess: () => {
      toast.success("Транзакция успешно создалась");
    },
    onError: () => {
      toast.error("Транзакция не создалась");
    },
  });

  const {
    mutateAsync: createCashTransaction,
    isPending: isPendingCreateCashTransaction,
  } = api.transaction.createCash.useMutation({
    onSuccess: () => {
      utils.reports.getById.invalidate({ id: params.id });
      setIsModalCashCreateOpen(false);
      form.reset();
      toast.success("Наличная транзакция успешно создана");
    },
    onError: () => {
      toast.error("Ошибка при создании наличной транзакции");
    },
  });

  const utils = api.useUtils();
  const {
    mutateAsync: updateDataReconciliation,
    isPending: isUpdatingDataReconciliation,
  } = api.reconciliation.update.useMutation({
    onSuccess: () => {
      utils.reports.getById.invalidate({ id: params.id });
    },
  });

  const { mutateAsync: updateReport, isPending: isUpdatingReport } =
    api.reports.update.useMutation({
      onSuccess: () => {
        utils.reports.getById.invalidate({ id: params.id });
      },
    });

  const form = useForm<SchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      addedBy: "",
      purpose: "",
    },
  });

  const cashTransactionForm = useForm<CashTransactionFormType>({
    resolver: zodResolver(cashTransactionFormSchema),
    defaultValues: {
      amount: 0,
      addedBy: "",
      purpose: "",
    },
  });

  const formatBalance = (balanceInKopecks: number) => {
    return (balanceInKopecks / 100).toLocaleString("ru-RU", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 2,
    });
  };

  const getTransactionDate = (reconciliation: any) => {
    // Prefer bank transaction date, fallback to CRM transaction date
    if (reconciliation.bankTransaction) {
      return reconciliation.bankTransaction.date;
    }
    if (reconciliation.crmTransaction) {
      return reconciliation.crmTransaction.date;
    }
    return new Date();
  };

  const filterByDateReconciliations = useCallback(
    (a: ReconciliationWithRelations, b: ReconciliationWithRelations) => {
      // Sort by transaction date (newest first), then by reconciliation ID for stability
      const dateA = getTransactionDate(a);
      const dateB = getTransactionDate(b);

      const dateDiff = new Date(dateB).getTime() - new Date(dateA).getTime();
      if (dateDiff !== 0) return dateDiff;

      // If dates are the same, sort by reconciliation ID for consistent ordering
      return a.id.localeCompare(b.id);
    },
    [],
  );

  const chooseTypeBank = (bank: TransactionType) => {
    setCurrentTransactionFilter(bank);
  };

  const handleNext = async () => {
    try {
      await updateReport({
        id: params.id,
        status: "expenses",
      });
    } catch (error) {
      console.error("Failed to update report status:", error);
    }
  };

  // Функция для проверки статуса сверки транзакции
  const isReconciliationResolved = useCallback(
    (reconciliation: ReconciliationWithRelations): boolean => {
      // Проверяем, есть ли и bankTransaction и crmTransaction (полная сверка)
      const isMatched = !!(
        reconciliation.bankTransaction && reconciliation.crmTransaction
      );
      // Или есть typeId (классифицирована)
      const hasType = !!reconciliation.typeId;
      return isMatched || hasType;
    },
    [],
  );

  // Группировка транзакций КНП === 190 с транзакциями из sales_report
  const knp190GroupedTransactions = useMemo(() => {
    if (!report || currentTransactionFilter !== "Kaspi") return new Map();

    const grouped = new Map<
      string,
      {
        knpTransaction: ReconciliationWithRelations;
        salesReportTransactions: ReconciliationWithRelations[];
      }
    >();

    // Находим все транзакции с КНП === 190 из документов типа Kaspi и bank_statement
    const knp190Transactions = report.reconciliations.filter((rec) => {
      if (
        rec.bankTransaction &&
        rec.bankTransaction.meta &&
        typeof rec.bankTransaction.meta === "object" &&
        "bank" in rec.bankTransaction.meta &&
        rec.bankTransaction.meta.bank === "Kaspi" &&
        rec.bankTransaction.meta["КНП"] === "190" &&
        rec.bankTransaction.document?.bankDocumentType === "bank_statement"
      ) {
        return true;
      }
      return false;
    });

    // Для каждой транзакции КНП === 190 находим соответствующие транзакции из sales_report
    knp190Transactions.forEach((knpRec) => {
      const meta = knpRec.bankTransaction?.meta;
      const paymentPurpose =
        meta && typeof meta === "object" && "Назначение платежа" in meta
          ? (meta["Назначение платежа"] as string | undefined)
          : undefined;
      const transactionDate = extractDateFromPaymentPurpose(paymentPurpose);

      if (!transactionDate || !transactionDate.isValid()) return;

      // Находим транзакции из sales_report с той же датой
      const salesReportTransactions = report.reconciliations.filter((rec) => {
        if (
          rec.bankTransaction &&
          rec.bankTransaction.meta &&
          typeof rec.bankTransaction.meta === "object" &&
          "bank" in rec.bankTransaction.meta &&
          rec.bankTransaction.meta.bank === "Kaspi" &&
          rec.bankTransaction.meta["КНП"] !== "190" &&
          rec.bankTransaction.document?.bankDocumentType === "sales_report"
        ) {
          const recDate = dayjs(rec.bankTransaction.date).startOf("day");
          const targetDate = transactionDate.startOf("day");
          return recDate.isSame(targetDate, "day");
        }
        return false;
      });

      grouped.set(knpRec.id, {
        knpTransaction: knpRec,
        salesReportTransactions,
      });
    });

    // Применяем фильтр по статусу сверки к гармошкам
    if (reconciliationStatusFilter === "all") {
      return grouped;
    }

    const filtered = new Map<
      string,
      {
        knpTransaction: ReconciliationWithRelations;
        salesReportTransactions: ReconciliationWithRelations[];
      }
    >();

    grouped.forEach((group, key) => {
      // Проверяем статус транзакций внутри гармошки
      const allTransactions = [
        group.knpTransaction,
        ...group.salesReportTransactions,
      ];
      const shouldInclude = allTransactions.some((rec) => {
        const resolved = isReconciliationResolved(rec);
        return reconciliationStatusFilter === "reconciled"
          ? resolved
          : !resolved;
      });

      if (shouldInclude) {
        // Фильтруем транзакции внутри гармошки
        const filteredSalesReport = group.salesReportTransactions.filter(
          (rec) => {
            const resolved = isReconciliationResolved(rec);
            return reconciliationStatusFilter === "reconciled"
              ? resolved
              : !resolved;
          },
        );

        filtered.set(key, {
          knpTransaction: group.knpTransaction,
          salesReportTransactions: filteredSalesReport,
        });
      }
    });

    return filtered;
  }, [
    report,
    currentTransactionFilter,
    reconciliationStatusFilter,
    isReconciliationResolved,
  ]);

  const reconciliations = useMemo(() => {
    if (report) {
      switch (currentTransactionFilter) {
        case "Kaspi":
          // Собираем ID всех транзакций из sales_report, которые попали в гармошку
          const excludedSalesReportIds = new Set<string>();
          if (knp190GroupedTransactions.size > 0) {
            Array.from(knp190GroupedTransactions.values()).forEach((group) => {
              group.salesReportTransactions.forEach(
                (rec: ReconciliationWithRelations) => {
                  if (rec.id) {
                    excludedSalesReportIds.add(rec.id);
                  }
                },
              );
            });
          }

          // Исключаем транзакции КНП === 190 и транзакции из sales_report, которые попали в гармошку
          const filtered = report.reconciliations
            .filter((reconciliation) => {
              // Исключаем транзакции, которые попали в гармошку
              if (excludedSalesReportIds.has(reconciliation.id)) {
                return false;
              }
              if (
                reconciliation.bankTransaction &&
                reconciliation.bankTransaction.meta &&
                typeof reconciliation.bankTransaction.meta === "object" &&
                "bank" in reconciliation.bankTransaction?.meta &&
                reconciliation.bankTransaction.meta.bank ===
                  currentTransactionFilter &&
                reconciliation.bankTransaction.meta["КНП"] !== "190"
              ) {
                return true;
              }

              return false;
            })
            .sort(filterByDateReconciliations);

          // Применяем фильтр по статусу сверки
          const statusFiltered =
            reconciliationStatusFilter === "all"
              ? filtered
              : filtered.filter((rec) => {
                  const resolved = isReconciliationResolved(rec);
                  return reconciliationStatusFilter === "reconciled"
                    ? resolved
                    : !resolved;
                });

          return Object.groupBy(
            statusFiltered,
            (rec) => rec.bankTransactionId!,
          );
        case "Halyk": {
          const filtered = report.reconciliations
            .filter((reconciliation) => {
              if (
                reconciliation.bankTransaction &&
                reconciliation.bankTransaction.meta &&
                typeof reconciliation.bankTransaction.meta === "object" &&
                "bank" in reconciliation.bankTransaction?.meta &&
                reconciliation.bankTransaction.meta.bank ===
                  currentTransactionFilter &&
                !(
                  reconciliation.bankTransaction.meta["Назначение платежа"] ||
                  ""
                )
                  .toString()
                  .includes("Расчеты по карточкам")
              ) {
                return true;
              }

              return false;
            })
            .sort(filterByDateReconciliations);

          const statusFiltered =
            reconciliationStatusFilter === "all"
              ? filtered
              : filtered.filter((rec) => {
                  const resolved = isReconciliationResolved(rec);
                  return reconciliationStatusFilter === "reconciled"
                    ? resolved
                    : !resolved;
                });

          return Object.groupBy(
            statusFiltered,
            (rec) => rec.bankTransactionId!,
          );
        }
        case "CRM": {
          const filtered = report.reconciliations
            .filter((reconciliation) => {
              if (reconciliation.crmTransaction) {
                return true;
              }

              return false;
            })
            .sort(filterByDateReconciliations);

          const statusFiltered =
            reconciliationStatusFilter === "all"
              ? filtered
              : filtered.filter((rec) => {
                  const resolved = isReconciliationResolved(rec);
                  return reconciliationStatusFilter === "reconciled"
                    ? resolved
                    : !resolved;
                });

          return Object.groupBy(statusFiltered, (rec) => rec.crmTransactionId!);
        }
        case "Cash": {
          const filtered = report.reconciliations
            .filter((reconciliation) => {
              if (
                reconciliation.crmTransaction &&
                reconciliation.crmTransaction.meta &&
                typeof reconciliation.crmTransaction.meta === "object" &&
                "byCash" in reconciliation.crmTransaction.meta &&
                reconciliation.crmTransaction.meta.byCash
              ) {
                return true;
              }

              return false;
            })
            .sort(filterByDateReconciliations);

          const statusFiltered =
            reconciliationStatusFilter === "all"
              ? filtered
              : filtered.filter((rec) => {
                  const resolved = isReconciliationResolved(rec);
                  return reconciliationStatusFilter === "reconciled"
                    ? resolved
                    : !resolved;
                });

          return Object.groupBy(statusFiltered, (rec) => rec.crmTransactionId!);
        }
        default:
          return [];
      }
    }
    return [];
  }, [
    currentTransactionFilter,
    report,
    filterByDateReconciliations,
    knp190GroupedTransactions,
    reconciliationStatusFilter,
    isReconciliationResolved,
  ]);

  const reconciliationTotals = useMemo(() => {
    let reconciledTotal = 0;
    let unreconciledTotal = 0;

    Object.values(reconciliations).forEach((recs) => {
      if (!recs || recs.length === 0) return;

      const rec = recs[0];
      const resolved = isReconciliationResolved(rec);
      const amount = rec.bankTransaction
        ? (rec.bankTransaction.amount || 0) / 100
        : rec.crmTransaction
          ? (rec.crmTransaction.amount || 0) / 100
          : 0;

      if (resolved) {
        reconciledTotal += amount;
      } else {
        unreconciledTotal += amount;
      }
    });

    if (currentTransactionFilter === "Kaspi") {
      Array.from(knp190GroupedTransactions.values()).forEach((group) => {
        group.salesReportTransactions.forEach(
          (rec: ReconciliationWithRelations) => {
            const resolved = isReconciliationResolved(rec);
            const amount = (rec.bankTransaction?.amount || 0) / 100;

            if (resolved) {
              reconciledTotal += amount;
            } else {
              unreconciledTotal += amount;
            }
          },
        );
      });
    }

    return { reconciledTotal, unreconciledTotal };
  }, [
    reconciliations,
    knp190GroupedTransactions,
    currentTransactionFilter,
    isReconciliationResolved,
  ]);

  const isKaspiTransactionsAmountOfDocumentsIsSame = useMemo(() => {
    if (!report) return false;

    const knpAmount = report.reconciliations.reduce((acc, rec) => {
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

          if (
            (txDate.isAfter(startDate) || txDate.isSame(startDate, "day")) &&
            (txDate.isBefore(endDate) || txDate.isSame(endDate, "day"))
          ) {
            acc += rec.bankTransaction.amount / 100;
          }
        }
      }
      return acc;
    }, 0);

    return report.documents.some((d) => d.balance === knpAmount);
  }, [report]);

  const notReconciliatedCrmTransactions = useMemo(() => {
    return report?.reconciliations.filter((reconciliation) => {
      if (
        !reconciliation.bankTransaction &&
        reconciliation.crmTransaction?.amount &&
        reconciliation.crmTransaction.meta &&
        typeof reconciliation.crmTransaction.meta === "object" &&
        "bank" in reconciliation.crmTransaction.meta &&
        reconciliation.crmTransaction.meta.bank === currentTransactionFilter
      ) {
        return true;
      }
      return false;
    });
  }, [report, currentTransactionFilter]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Загрузка транзакций...
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Отчет не найден</p>
        </div>
      </div>
    );
  }

  const bankReconciliations = Object.groupBy(
    report.reconciliations.filter((reconciliation) => {
      if (reconciliation.bankTransaction) {
        return true;
      }

      return false;
    }),
    (rec) => rec.bankTransactionId!,
  );

  const crmReconciliations = report.reconciliations.filter((reconciliation) => {
    if (reconciliation.crmTransaction) return true;
    return false;
  });

  const incomeCrmReconciliations = report.reconciliations
    .filter((reconciliation) => {
      if (
        reconciliation.crmTransaction &&
        reconciliation.crmTransaction.amount > 0
      ) {
        return true;
      }
      return false;
    })
    .sort(filterByDateReconciliations);

  // Filter reconciliations with positive amounts (income transactions)
  const incomeReconciliations = report.reconciliations
    .filter((reconciliation) => {
      // Check bank transaction
      if (
        reconciliation.bankTransaction &&
        reconciliation.bankTransaction.amount > 0
      ) {
        return true;
      }
      // Check CRM transaction
      if (
        reconciliation.crmTransaction &&
        reconciliation.crmTransaction.amount > 0
      ) {
        return true;
      }
      return false;
    })
    .sort(filterByDateReconciliations);

  const handleViewReconciliations = (
    reconciliations: ReconciliationWithRelations[],
  ) => {
    setIsModalReconciliationsDetailOpen(true);
    setCurrentReconciliations(reconciliations);
  };

  const handleViewTransactions = (
    reconciliation: ReconciliationWithRelations,
  ) => {
    setIsModalReconciliationDetailOpen(true);
    setCurrentBankReconciliation(reconciliation);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalReconciliationDetailOpen(open);
  };

  const handleReconciliationCreate = (
    reconciliation: ReconciliationWithRelations,
  ) => {
    setCurrentBankReconciliation(reconciliation);
    setIsModalReconciliationCreateOpen(true);
  };

  const handleModalReconciliationCreateChange = (open: boolean) => {
    setIsModalReconciliationCreateOpen(open);
  };

  const handleCreateReconcile = (
    reconciliation: ReconciliationWithRelations,
  ) => {
    setIsModalReconcileCreateOpen(true);
    setCurrentBankReconciliation(reconciliation);
  };

  const handleModalReconcileCreateChange = (open: boolean) => {
    setIsModalReconcileCreateOpen(open);
  };

  const handlePickCrmTransactions = (transactionId: string) => {
    if (pickedCrmTransactions.includes(transactionId)) {
      setPickedCrmTransactions((prev) =>
        prev.filter((tId) => tId !== transactionId),
      );
      return;
    }

    setPickedCrmTransactions((prev) => [...prev, transactionId]);
  };

  const handleCreateNewReconciliation = async () => {
    if (
      currentBankReconciliation &&
      currentBankReconciliation.bankTransactionId
    ) {
      await updateReconciliation({
        reconciliationId: currentBankReconciliation.id,
        crmTransactionsIds: pickedCrmTransactions,
        bankTransactionId: currentBankReconciliation.bankTransactionId,
      });

      setIsModalReconciliationCreateOpen(false);
      setPickedCrmTransactions([]);
      toast.success("Транзакция успешно сверилась");
    }
  };

  // const totalIncome = Object.values(bankReconciliations).reduce((sum, reconciliation) => {
  //   return sum + getTransactionAmount(reconciliation![0]);
  // }, 0);

  const bankTurnover = Object.values(bankReconciliations).reduce((sum, rec) => {
    return sum + (rec![0].bankTransaction?.amount || 0);
  }, 0);

  const crmTurnover = crmReconciliations.reduce((sum, rec) => {
    return sum + (rec.crmTransaction?.amount || 0);
  }, 0);

  const getTransactionTypeName = (typeId: string | null) => {
    if (!typeId || !transactionTypes) return null;
    const type = transactionTypes.find((t) => t.id === typeId);
    return type?.name || null;
  };

  const getSourceAndType = (reconciliation: any) => {
    const source =
      reconciliation.bankTransaction && reconciliation.crmTransaction
        ? "Банк + CRM"
        : reconciliation.bankTransaction
          ? reconciliation.bankTransaction.document.name
          : "CRM";

    const typeName = getTransactionTypeName(reconciliation.typeId);

    if (typeName) {
      return `${source} • ${typeName}`;
    }

    return source;
  };

  const handleSubmit = async (values: SchemaType) => {
    if (
      currentBankReconciliation &&
      currentBankReconciliation.bankTransactionId
    ) {
      const crmTransaction = await createTransaction({
        amount: currentBankReconciliation.bankTransaction!.amount,
        documentId: incomeCrmReconciliations[0].crmTransaction!.documentId!,
        meta: {
          Purpose: values.purpose,
          "Added by": values.addedBy,
        },
      });

      await updateBankReconciliation({
        reconciliationId: currentBankReconciliation.id,
        bankTransactionId: currentBankReconciliation.bankTransactionId,
        crmTransactionId: crmTransaction.id,
      });

      setIsModalReconcileCreateOpen(false);
      toast.success("Транзакция успешно сверилась");
    }
  };

  const handleCreateCashTransaction = async (
    values: CashTransactionFormType,
  ) => {
    if (!report || incomeCrmReconciliations.length === 0) {
      toast.error("Не найден CRM документ для создания транзакции");
      return;
    }

    const documentId = incomeCrmReconciliations[0].crmTransaction!.documentId!;
    const amountInKopecks = Math.round(values.amount * 100);

    await createCashTransaction({
      amount: amountInKopecks,
      reportId: params.id,
      addedBy: values.addedBy,
      purpose: values.purpose,
      documentId: documentId,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          {!isKaspiTransactionsAmountOfDocumentsIsSame && (
            <div className="mb-3 text-red-500">
              <p>
                Сумма из Отчета по продажам не равна сумме Продаж из выписки,
                проверьте пожалуйста документы!
              </p>
            </div>
          )}
          <div className="flex space-x-3">
            <div className="flex items-center space-x-1">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Оборот банка
                </p>
                <div>
                  {report.documents
                    .filter((d) => d.type === "bank")
                    .map((d) => (
                      <p
                        key={d.id}
                        className="text-xs font-bold text-green-700 dark:text-green-300"
                      >
                        {d.name}:{" "}
                        <span className="text-red-700">
                          {formatBalance(d.balance * 100)}
                        </span>
                      </p>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Оборот CRM
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatBalance(crmTurnover)}
                </p>
              </div>
            </div>
            {/* <div className="flex items-center space-x-1">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Не сверено
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  Сделать
                </p>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className={`p-2 border border-blue-600 hover:border-blue-700 rounded-xl cursor-pointer ${currentTransactionFilter === "Kaspi" && "bg-blue-600"}`}
            onClick={() => chooseTypeBank("Kaspi")}
          >
            Kaspi
          </button>
          <button
            type="button"
            className={`p-2 border border-blue-600 hover:border-blue-700 rounded-xl cursor-pointer ${currentTransactionFilter === "Halyk" && "bg-blue-600"}`}
            onClick={() => chooseTypeBank("Halyk")}
          >
            Halyk
          </button>
          <button
            type="button"
            className={`p-2 border border-blue-600 hover:border-blue-700 rounded-xl cursor-pointer ${currentTransactionFilter === "CRM" && "bg-blue-600"}`}
            onClick={() => chooseTypeBank("CRM")}
          >
            CRM
          </button>
          <button
            type="button"
            className={`p-2 border border-blue-600 hover:border-blue-700 rounded-xl cursor-pointer ${currentTransactionFilter === "Cash" && "bg-blue-600"}`}
            onClick={() => chooseTypeBank("Cash")}
          >
            Наличные
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Фильтр:
          </span>
          <Select
            value={reconciliationStatusFilter}
            onValueChange={(value: "all" | "reconciled" | "unreconciled") =>
              setReconciliationStatusFilter(value)
            }
          >
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="reconciled">Сверенные</SelectItem>
              <SelectItem value="unreconciled">Не сверенные</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {Object.values(reconciliations).length > 0 ||
      (currentTransactionFilter === "Kaspi" &&
        knp190GroupedTransactions.size > 0) ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">
              Транзакции (
              {Object.values(reconciliations).length +
                (currentTransactionFilter === "Kaspi"
                  ? Array.from(knp190GroupedTransactions.values()).length
                  : 0)}
              )
            </h3>
            {currentTransactionFilter === "Cash" && (
              <Button
                onClick={() => setIsModalCashCreateOpen(true)}
                className="px-4 py-2"
              >
                Создать наличную транзакцию
              </Button>
            )}
          </div>
          <div className="w-[100%] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Гармошка для транзакций КНП === 190 */}
                {currentTransactionFilter === "Kaspi" &&
                  Array.from(knp190GroupedTransactions.values()).map(
                    (group) => {
                      const knpAmount =
                        (group.knpTransaction.bankTransaction?.amount || 0) /
                        100;
                      const salesReportAmount =
                        group.salesReportTransactions.reduce(
                          (sum: number, rec: ReconciliationWithRelations) => {
                            return (
                              sum + (rec.bankTransaction?.amount || 0) / 100
                            );
                          },
                          0,
                        );
                      const amountsMatch =
                        Math.abs(knpAmount - salesReportAmount) < 0.01;

                      return (
                        <Knp190Accordion
                          key={group.knpTransaction.id}
                          knpTransaction={group.knpTransaction}
                          salesReportTransactions={
                            group.salesReportTransactions
                          }
                          transactionTypes={transactionTypes}
                          updateReconciliation={updateDataReconciliation}
                          isUpdatingReconciliation={isUpdatingReconciliation}
                          handleViewReconciliations={handleViewReconciliations}
                          handleCreateReconcile={handleCreateReconcile}
                          handleReconciliationCreate={
                            handleReconciliationCreate
                          }
                          notReconciliatedCrmTransactions={
                            notReconciliatedCrmTransactions || []
                          }
                          pickedCrmTransactions={pickedCrmTransactions}
                          amountsMatch={amountsMatch}
                        />
                      );
                    },
                  )}
                {/* Обычные транзакции */}
                {Object.values(reconciliations).map(
                  (reconciliations) =>
                    reconciliations && (
                      <ReconciliationRowV2
                        key={reconciliations[0].id}
                        reconciliations={reconciliations}
                        transactionTypes={transactionTypes}
                        updateReconciliation={updateDataReconciliation}
                        isUpdatingReconciliation={isUpdatingReconciliation}
                        handleViewReconciliations={handleViewReconciliations}
                        handleCreateReconcile={handleCreateReconcile}
                        handleReconciliationCreate={handleReconciliationCreate}
                        notReconciliatedCrmTransactions={
                          notReconciliatedCrmTransactions || []
                        }
                        pickedCrmTransactions={pickedCrmTransactions}
                        currentTransactionFilter={currentTransactionFilter}
                        type="bank"
                        isMini={false}
                      />
                    ),
                )}
              </div>
            </div>
          </div>
          {/* Тоталы сверенных и не сверенных транзакций */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Сверенные транзакции
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatBalance(reconciliationTotals.reconciledTotal * 100)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Не сверенные транзакции
                  </p>
                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {formatBalance(
                      reconciliationTotals.unreconciledTotal * 100,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Всего
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatBalance(
                      (reconciliationTotals.reconciledTotal +
                        reconciliationTotals.unreconciledTotal) *
                        100,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Нет доходных транзакций
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Доходные транзакции появятся после загрузки и сверки документов
          </p>
          {currentTransactionFilter === "Cash" && (
            <Button onClick={() => setIsModalCashCreateOpen(true)}>
              Создать наличную транзакцию
            </Button>
          )}
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleNext}
          disabled={isUpdatingReport}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUpdatingReport ? "Обновление..." : "Далее"}
        </button>
      </div>

      <Dialog
        open={isModalReconciliationDetailOpen}
        onOpenChange={handleModalOpenChange}
      >
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Транзакция</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] scrollbar-hide">
            {
              <div>
                <div className="pt-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Банковские метаданные:
                  </h4>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    {currentBankReconciliation?.bankTransaction?.meta &&
                    typeof currentBankReconciliation.bankTransaction.meta ===
                      "object" ? (
                      Object.entries(
                        currentBankReconciliation.bankTransaction.meta,
                      ).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-start"
                        >
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {key}:
                          </span>
                          <span className="text-sm text-gray-900 dark:text-gray-100 text-right max-w-xs truncate">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Нет доступных метаданных
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CRM метаданные:
                  </h4>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    {currentBankReconciliation?.crmTransaction?.meta &&
                    typeof currentBankReconciliation.crmTransaction.meta ===
                      "object" ? (
                      Object.entries(
                        currentBankReconciliation.crmTransaction.meta,
                      ).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-start"
                        >
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {key}:
                          </span>
                          <span className="text-sm text-gray-900 dark:text-gray-100 text-right max-w-xs truncate">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Нет доступных метаданных
                      </p>
                    )}
                  </div>
                </div>
              </div>
            }
          </div>
          <DialogFooter>
            <div className="flex justify-between items-center w-full"></div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentReconciliations?.length > 0 && 
        <ReconciliationDetailModal
          isModalReconciliationsDetailOpen={isModalReconciliationsDetailOpen}
          setIsModalReconciliationsDetailOpen={setIsModalReconciliationsDetailOpen}
          currentReconciliations={currentReconciliations}
        />
      }

      <CreateReconciliationModal
        isModalReconciliationCreateOpen={isModalReconciliationCreateOpen}
        handleModalReconciliationCreateChange={handleModalReconciliationCreateChange}
        currentBankReconciliation={currentBankReconciliation}
        notReconciliatedCrmTransactions={notReconciliatedCrmTransactions || []}
        handleCreateNewReconciliation={handleCreateNewReconciliation}
        transactionTypes={transactionTypes}
        updateDataReconciliation={updateDataReconciliation}
        isUpdatingReconciliation={isUpdatingReconciliation}
        handleViewTransactions={handleViewTransactions}
        handleReconciliationCreate={handleReconciliationCreate}
        pickedCrmTransactions={pickedCrmTransactions}
        handlePickCrmTransactions={handlePickCrmTransactions}
      />

      <Dialog
        open={isModalReconcileCreateOpen}
        onOpenChange={handleModalReconcileCreateChange}
      >
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Транзакция</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] scrollbar-hide">
            {currentBankReconciliation?.bankTransaction && (
              <div className="pt-3">
                <p className="text-lg font-bold">Банковская транзакция</p>
                {formatBalance(
                  currentBankReconciliation.bankTransaction.amount,
                )}
              </div>
            )}

            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <p className="my-2 text-lg font-bold">CRM транзакция</p>
              <div className="flex flex-col space-y-4 p-4">
                <label>
                  <span>Кем добавлена</span>
                  <Input
                    type="string"
                    placeholder=""
                    {...form.register("addedBy")}
                    className={cn(
                      form.formState.errors.addedBy && "border-red-500",
                    )}
                  />
                </label>
                <label>
                  <span>Цель</span>
                  <Input
                    type="string"
                    placeholder=""
                    {...form.register("purpose")}
                    className={cn(
                      form.formState.errors.purpose && "border-red-500",
                    )}
                  />
                </label>
                <div className="flex flex-col w-full space-y-3">
                  <Button size="sm" type="submit">
                    Сохранить
                  </Button>
                </div>
              </div>
            </form>
          </div>
          <DialogFooter> </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальное окно для создания наличной транзакции */}
      <Dialog
        open={isModalCashCreateOpen}
        onOpenChange={setIsModalCashCreateOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать наличную транзакцию</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={cashTransactionForm.handleSubmit(
              handleCreateCashTransaction,
            )}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Сумма (₸)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...cashTransactionForm.register("amount", {
                  valueAsNumber: true,
                })}
                className={cn(
                  cashTransactionForm.formState.errors.amount &&
                    "border-red-500",
                )}
              />
              {cashTransactionForm.formState.errors.amount && (
                <p className="text-sm text-red-500 mt-1">
                  {cashTransactionForm.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Кто создал
              </label>
              <Input
                type="text"
                placeholder="Введите имя"
                {...cashTransactionForm.register("addedBy")}
                className={cn(
                  cashTransactionForm.formState.errors.addedBy &&
                    "border-red-500",
                )}
              />
              {cashTransactionForm.formState.errors.addedBy && (
                <p className="text-sm text-red-500 mt-1">
                  {cashTransactionForm.formState.errors.addedBy.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Зачем создал
              </label>
              <Input
                type="text"
                placeholder="Введите цель"
                {...cashTransactionForm.register("purpose")}
                className={cn(
                  cashTransactionForm.formState.errors.purpose &&
                    "border-red-500",
                )}
              />
              {cashTransactionForm.formState.errors.purpose && (
                <p className="text-sm text-red-500 mt-1">
                  {cashTransactionForm.formState.errors.purpose.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalCashCreateOpen(false);
                  cashTransactionForm.reset();
                }}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isPendingCreateCashTransaction}>
                {isPendingCreateCashTransaction ? "Создание..." : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
