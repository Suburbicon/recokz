import { api } from "@/shared/lib/trpc/client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Prisma, Transaction } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { toast } from 'sonner';
import { ReconciliationRow } from "./components/ReconciliationRow";

const reconciliationWithRelations = {
  include: {
    bankTransaction: true,
    crmTransaction: true,
    type: true,
  },
};

type ReconciliationWithRelations = Prisma.ReconciliationGetPayload<
  typeof reconciliationWithRelations
>;

export const ImportSales = () => {
  const params = useParams<{ id: string }>();
  const [isModalReconciliationDetailOpen, setIsModalReconciliationDetailOpen] = useState(false);
  const [isModalReconciliationCreateOpen, setIsModalReconciliationCreateOpen] = useState(false);
  const [currentBankReconciliation, setCurrentBankReconciliation] = useState<ReconciliationWithRelations>();
  const [pickedCrmTransactions, setPickedCrmTransactions] = useState<string[]>([]);

  const { data: report, isLoading } = api.reports.getById.useQuery({
    id: params.id,
  });

  const { 
    mutateAsync: updateBankReconciliation, 
    isPending: isUpdatingBankReconciliation 
  } = api.reconciliation.updateReconcile.useMutation({
    onSuccess: () => {
      utils.reports.getById.invalidate({ id: params.id });
    }
  })

  const { data: transactionTypes } = api.transactionType.getAll.useQuery({
    category: "income",
  });

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
    return new Date(date).toLocaleString("ru-RU", {
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
        status: "expenses",
      });
    } catch (error) {
      console.error("Failed to update report status:", error);
    }
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

  const filterByDateReconciliations = (a: ReconciliationWithRelations, b: ReconciliationWithRelations) => {
    // Sort by transaction date (newest first), then by reconciliation ID for stability
    const dateA = getTransactionDate(a);
    const dateB = getTransactionDate(b);
    
    const dateDiff = new Date(dateB).getTime() - new Date(dateA).getTime();
    if (dateDiff !== 0) return dateDiff;

    // If dates are the same, sort by reconciliation ID for consistent ordering
    return a.id.localeCompare(b.id);
  }

  const incomeBankReconciliations = report.reconciliations
    .filter((reconciliation) => {
      if (
        reconciliation.bankTransaction &&
        reconciliation.bankTransaction.amount > 0
      ) {
        return true;
      }

      return false;
    })
    .sort(filterByDateReconciliations);

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

  const notReconciliatedCrmTransactions = report.reconciliations
    .filter((reconciliation) => {
      if (
        !reconciliation.bankTransaction &&
        reconciliation.crmTransaction?.amount &&
        reconciliation.crmTransaction?.amount > 0
      ) return true
      return false
    })

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

  const getTransactionAmount = (reconciliation: any) => {
    // Prefer bank transaction amount, fallback to CRM transaction amount
      if (
        reconciliation.bankTransaction &&
        reconciliation.bankTransaction.amount > 0
      ) {
        return reconciliation.bankTransaction.amount;
      }
      if (
        reconciliation.crmTransaction &&
        reconciliation.crmTransaction.amount > 0
      ) {
        return reconciliation.crmTransaction.amount;
      }
      return 0;
  };

  const handleViewTransactions = (reconciliation: ReconciliationWithRelations) => {
    setIsModalReconciliationDetailOpen(true);
    setCurrentBankReconciliation(reconciliation);
  }

  const handleModalOpenChange = (open: boolean) => {
    setIsModalReconciliationDetailOpen(open);
  };

  const handleReconciliationCreate = (reconciliation: ReconciliationWithRelations) => {
    setIsModalReconciliationCreateOpen(true);
    setCurrentBankReconciliation(reconciliation);
  };

  const handleModalReconciliationCreateChange = (open: boolean) => {
    setIsModalReconciliationCreateOpen(open);
  }

  const handlePickCrmTransactions = (transactionId: string) => {
    if (pickedCrmTransactions.includes(transactionId)) {
      setPickedCrmTransactions(prev => prev.filter(tId => tId !== transactionId))
      return
    }

    setPickedCrmTransactions(prev => [...prev, transactionId])
  }

  const handleCreateNewReconciliation = async () => {
    if (currentBankReconciliation && currentBankReconciliation.bankTransactionId) {
      console.log(pickedCrmTransactions)
      await updateBankReconciliation({
        reconciliationId: currentBankReconciliation.id,
        crmTransactionsIds: pickedCrmTransactions,
        bankTransactionId: currentBankReconciliation.bankTransactionId
      })

      toast.success('Транзакция успешно сверилась');
    }
  }

  const totalIncome = incomeReconciliations.reduce((sum, reconciliation) => {
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
          ? reconciliation.bankTransaction.document.name
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
        <h2 className="text-xl font-semibold mb-4">Доходы (Продажи)</h2>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Общая сумма доходов
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatBalance(totalIncome)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {incomeBankReconciliations.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-3">
            Банковские транзакции доходов ({incomeBankReconciliations.length})
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {incomeBankReconciliations.map((reconciliation) => (
                  <ReconciliationRow
                    key={reconciliation.id}
                    reconciliation={reconciliation}
                    transactionTypes={transactionTypes}
                    updateReconciliation={updateReconciliation}
                    isUpdatingReconciliation={isUpdatingReconciliation}
                    handleViewTransactions={handleViewTransactions}
                    handleReconciliationCreate={handleReconciliationCreate}
                    type="bank"
                    isMini={false}
                  />
                ))}
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
          <p className="text-gray-500 dark:text-gray-400">
            Доходные транзакции появятся после загрузки и сверки документов
          </p>
        </div>
      )}

      {incomeCrmReconciliations.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-3">
            CRM транзакции доходов ({incomeCrmReconciliations.length})
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {incomeCrmReconciliations.map((reconciliation) => (
                  <ReconciliationRow
                    key={reconciliation.id}
                    reconciliation={reconciliation}
                    transactionTypes={transactionTypes}
                    updateReconciliation={updateReconciliation}
                    isUpdatingReconciliation={isUpdatingReconciliation}
                    handleViewTransactions={handleViewTransactions}
                    handleReconciliationCreate={handleReconciliationCreate}
                    type="crm"
                    isMini={false}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Нет доходных CRM транзакций
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Доходные CRM транзакции появятся после загрузки и сверки документов
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
          {isUpdatingReport ? "Обновление..." : "Далее"}
        </button>
      </div>

      <Dialog open={isModalReconciliationDetailOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Транзакция</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] scrollbar-hide">
            {(
              <div>
                <div className="pt-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Банковские метаданные:
                  </h4>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    {currentBankReconciliation?.bankTransaction?.meta &&
                    typeof currentBankReconciliation.bankTransaction.meta === "object" ? (
                      Object.entries(currentBankReconciliation.bankTransaction.meta).map(
                        ([key, value]) => (
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
                        ),
                      )
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
                    typeof currentBankReconciliation.crmTransaction.meta === "object" ? (
                      Object.entries(currentBankReconciliation.crmTransaction.meta).map(
                        ([key, value]) => (
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
                        ),
                      )
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Нет доступных метаданных
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex justify-between items-center w-full">
              
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalReconciliationCreateOpen} onOpenChange={handleModalReconciliationCreateChange}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Транзакция</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] scrollbar-hide">
            {(currentBankReconciliation?.bankTransaction) && (
              <div className="pt-3">
                <p className="text-lg font-bold">Банковская транзакция</p>
                {formatBalance(currentBankReconciliation.bankTransaction.amount)}
              </div>
            )}

            <p className="my-2 text-lg font-bold">CRM транзакции</p>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto scrollbar-hide">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notReconciliatedCrmTransactions.map((reconciliation) => (
                    <ReconciliationRow
                      key={reconciliation.id}
                      reconciliation={reconciliation}
                      transactionTypes={transactionTypes}
                      updateReconciliation={updateReconciliation}
                      isUpdatingReconciliation={isUpdatingReconciliation}
                      handleViewTransactions={handleViewTransactions}
                      handleReconciliationCreate={handleReconciliationCreate}
                      pickedCrmTransactions={pickedCrmTransactions}
                      handlePickCrmTransactions={handlePickCrmTransactions}
                      type="crm"
                      isMini={true}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex flex-col w-full space-y-3">              
              <Button 
                size="sm"
                onClick={handleCreateNewReconciliation}
              >
                Сохранить
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
