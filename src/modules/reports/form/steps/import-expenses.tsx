import { api } from "@/shared/lib/trpc/client";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, CreditCard } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export const ImportExpenses = () => {
  const params = useParams<{ id: string }>();

  const { data: report, isLoading } = api.reports.getById.useQuery({
    id: params.id,
  });

  const { data: transactionTypes } = api.transactionType.getAll.useQuery();

  const utils = api.useUtils();
  const {
    mutateAsync: updateReconciliation,
    isPending: isUpdatingReconciliation,
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

  const formatBalance = (balanceInKopecks: number) => {
    return (balanceInKopecks / 100).toLocaleString("ru-RU", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 2,
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleTypeChange = async (reconciliationId: string, typeId: string) => {
    try {
      await updateReconciliation({
        id: reconciliationId,
        typeId: typeId,
      });
    } catch (error) {
      console.error("Failed to update reconciliation type:", error);
    }
  };

  const handleNext = async () => {
    try {
      await updateReport({
        id: params.id,
        status: "done",
      });
    } catch (error) {
      console.error("Failed to update report status:", error);
    }
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

  // Filter reconciliations with negative amounts (expense transactions)
  const expenseReconciliations = report.reconciliations
    .filter((reconciliation) => {
      // Check bank transaction
      if (
        reconciliation.bankTransaction &&
        reconciliation.bankTransaction.amount < 0
      ) {
        return true;
      }
      // Check CRM transaction
      if (
        reconciliation.crmTransaction &&
        reconciliation.crmTransaction.amount < 0
      ) {
        return true;
      }
      return false;
    })
    .sort((a, b) => {
      // Sort by transaction date (newest first), then by reconciliation ID for stability
      const dateA = getTransactionDate(a);
      const dateB = getTransactionDate(b);

      const dateDiff = new Date(dateB).getTime() - new Date(dateA).getTime();
      if (dateDiff !== 0) return dateDiff;

      // If dates are the same, sort by reconciliation ID for consistent ordering
      return a.id.localeCompare(b.id);
    });

  const getTransactionAmount = (reconciliation: any) => {
    // Prefer bank transaction amount, fallback to CRM transaction amount
    if (
      reconciliation.bankTransaction &&
      reconciliation.bankTransaction.amount < 0
    ) {
      return Math.abs(reconciliation.bankTransaction.amount); // Show as positive for display
    }
    if (
      reconciliation.crmTransaction &&
      reconciliation.crmTransaction.amount < 0
    ) {
      return Math.abs(reconciliation.crmTransaction.amount); // Show as positive for display
    }
    return 0;
  };

  const isMatched = (reconciliation: any) => {
    return reconciliation.bankTransaction && reconciliation.crmTransaction;
  };

  const isResolved = (reconciliation: any) => {
    // Consider resolved if it's either fully matched OR has a transaction type assigned
    return isMatched(reconciliation) || !!reconciliation.typeId;
  };

  const getStatusText = (reconciliation: any) => {
    if (isMatched(reconciliation)) {
      return "Сверено";
    } else if (reconciliation.typeId) {
      return "Сверено";
    } else {
      return "Частично";
    }
  };

  const getStatusColor = (reconciliation: any) => {
    if (isResolved(reconciliation)) {
      return "text-green-600 dark:text-green-400";
    } else {
      return "text-yellow-600 dark:text-yellow-400";
    }
  };

  const getIconAndBgColor = (reconciliation: any) => {
    if (isResolved(reconciliation)) {
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        icon: (
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        ),
      };
    } else {
      return {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        icon: (
          <XCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        ),
      };
    }
  };

  const totalExpenses = expenseReconciliations.reduce((sum, reconciliation) => {
    return sum + getTransactionAmount(reconciliation);
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
          ? "Банк"
          : "CRM";

    const typeName = getTransactionTypeName(reconciliation.typeId);

    if (typeName) {
      return `${source} • ${typeName}`;
    }

    return source;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Расходы (ЭТО УДАЛИМ)</h2>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Общая сумма расходов
              </p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatBalance(totalExpenses)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {expenseReconciliations.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-3">
            Транзакции расходов ({expenseReconciliations.length})
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {expenseReconciliations.map((reconciliation) => (
                  <div
                    key={reconciliation.id}
                    className="flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            getIconAndBgColor(reconciliation).bg
                          }`}
                        >
                          {getIconAndBgColor(reconciliation).icon}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {formatBalance(
                                  getTransactionAmount(reconciliation),
                                )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(getTransactionDate(reconciliation))}
                              </p>
                            </div>

                            <div className="text-xs">
                              <p
                                className={`font-medium ${getStatusColor(reconciliation)}`}
                              >
                                {getStatusText(reconciliation)}
                              </p>
                              <p className="text-gray-500 dark:text-gray-400">
                                {getSourceAndType(reconciliation)}
                              </p>
                            </div>
                          </div>

                          {!isResolved(reconciliation) && (
                            <div className="flex-shrink-0">
                              <Select
                                value={reconciliation.typeId || ""}
                                onValueChange={(value) =>
                                  handleTypeChange(reconciliation.id, value)
                                }
                                disabled={isUpdatingReconciliation}
                              >
                                <SelectTrigger className="w-32 h-7 text-xs">
                                  <SelectValue placeholder="Тип" />
                                </SelectTrigger>
                                <SelectContent>
                                  {transactionTypes?.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 dark:text-gray-500 ml-3 flex-shrink-0">
                      {reconciliation.id.slice(0, 6)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Нет расходных транзакций
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Расходные транзакции появятся после загрузки и сверки документов
          </p>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleNext}
          disabled={isUpdatingReport}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUpdatingReport ? "Завершение..." : "Завершить"}
        </button>
      </div>
    </div>
  );
};
