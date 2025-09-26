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
import { toast } from 'sonner';
import { ReconciliationRow } from "./components/ReconciliationRow";
import { ReconciliationRowV2 } from './components/ReconciliationRowV2';
import { Input } from "@/shared/ui/input";

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

type TransactionType = 'Kaspi' | 'Halyk' | 'CRM' | 'Cash';

export const formSchema = z.object({
  addedBy: z.string({ message: "Обязательное поле" }).min(1, "Обязательное поле"),
  purpose: z.string({ message: "Обязательное поле" }).min(1, "Обязательное поле")
});

type SchemaType = z.infer<typeof formSchema>;

export const ImportSales = () => {
  const params = useParams<{ id: string }>();
  const [isModalReconciliationDetailOpen, setIsModalReconciliationDetailOpen] = useState(false);
  const [isModalReconciliationsDetailOpen, setIsModalReconciliationsDetailOpen] = useState(false);
  const [isModalReconciliationCreateOpen, setIsModalReconciliationCreateOpen] = useState(false);
  const [isModalReconcileCreateOpen, setIsModalReconcileCreateOpen] = useState(false);
  const [currentBankReconciliation, setCurrentBankReconciliation] = useState<ReconciliationWithRelations>();
  const [currentReconciliations, setCurrentReconciliations] = useState<ReconciliationWithRelations[]>([]);
  const [pickedCrmTransactions, setPickedCrmTransactions] = useState<string[]>([]);
  const [currentTransactionFilter, setCurrentTransactionFilter] = useState<TransactionType>('Kaspi')

  const { data: report, isLoading } = api.reports.getById.useQuery({
    id: params.id,
  });

  const { 
    mutateAsync: updateReconciliation, 
    isPending: isUpdatingReconciliation 
  } = api.reconciliation.updateReconcile.useMutation({
    onSuccess: () => {
      utils.reports.getById.invalidate({ id: params.id });
    }
  })

  const { 
    mutateAsync: updateBankReconciliation, 
    isPending: isUpdatingBankReconciliation 
  } = api.reconciliation.updateBankReconcile.useMutation({
    onSuccess: () => {
      utils.reports.getById.invalidate({ id: params.id });
    }
  })

  const { data: transactionTypes } = api.transactionType.getAll.useQuery({
    category: "income",
  });

  const { mutateAsync: createTransaction, isPending: isPendingCreateTransaction } = api.transaction.create.useMutation({
    onSuccess: () => {
      toast.success('Транзакция успешно создалась');
    },
    onError: () => {
      toast.error('Транзакция не создалась');
    }
  })

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
      addedBy: '',
      purpose: ''
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

  const filterByDateReconciliations = useCallback((a: ReconciliationWithRelations, b: ReconciliationWithRelations) => {
    // Sort by transaction date (newest first), then by reconciliation ID for stability
    const dateA = getTransactionDate(a);
    const dateB = getTransactionDate(b);
    
    const dateDiff = new Date(dateB).getTime() - new Date(dateA).getTime();
    if (dateDiff !== 0) return dateDiff;

    // If dates are the same, sort by reconciliation ID for consistent ordering
    return a.id.localeCompare(b.id);
  }, [])

  const chooseTypeBank = (bank: TransactionType ) => {
    setCurrentTransactionFilter(bank)
  }

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

  const reconciliations = useMemo(() => {
    if (report) {
      switch(currentTransactionFilter) {
        case 'Kaspi':
          return Object.groupBy(report.reconciliations
            .filter((reconciliation) => {
              if (
                reconciliation.bankTransaction && reconciliation.bankTransaction.meta &&
                typeof reconciliation.bankTransaction.meta === 'object' && 'bank' in reconciliation.bankTransaction?.meta &&
                reconciliation.bankTransaction.meta.bank === currentTransactionFilter &&
                reconciliation.bankTransaction.meta['КНП'] !== '190'
              ) {
                return true;
              }

              return false;
            })
            .sort(filterByDateReconciliations),
            rec => rec.bankTransactionId!
          )
        case 'Halyk':
          return Object.groupBy(report.reconciliations
            .filter((reconciliation) => {
              if (
                reconciliation.bankTransaction && reconciliation.bankTransaction.meta &&
                typeof reconciliation.bankTransaction.meta === 'object' && 'bank' in reconciliation.bankTransaction?.meta &&
                reconciliation.bankTransaction.meta.bank === currentTransactionFilter
              ) {
                return true;
              }

              return false;
            })
            .sort(filterByDateReconciliations),
            rec => rec.bankTransactionId!
          )
        case 'CRM':
          return Object.groupBy(report.reconciliations
            .filter((reconciliation) => {
              if (reconciliation.crmTransaction) {
                return true;
              }

              return false;
            })
            .sort(filterByDateReconciliations),
            rec => rec.crmTransactionId!
          )
        case 'Cash':
          return Object.groupBy(report.reconciliations
            .filter((reconciliation) => {
              if (reconciliation.crmTransaction && reconciliation.crmTransaction.meta &&
                typeof reconciliation.crmTransaction.meta === 'object' && 'byCash' in reconciliation.crmTransaction.meta &&
                reconciliation.crmTransaction.meta.byCash
              ) {
                return true;
              }

              return false;
            })
            .sort(filterByDateReconciliations),
            rec => rec.crmTransactionId!
          )
        default:
          return []
      }
    }
    return []
  }, [currentTransactionFilter, report, filterByDateReconciliations]);

  const isKaspiTransactionsAmountOfDocumentsIsSame = useMemo(() => {
    const knpAmount = report?.reconciliations.reduce((acc, rec) => {
      if (
        rec.bankTransaction && rec.bankTransaction.meta &&
        typeof rec.bankTransaction.meta === 'object' && 'КНП' in rec.bankTransaction?.meta &&
        rec.bankTransaction.meta['КНП'] === '190'
      ) {
        acc += rec.bankTransaction.amount / 100
      }
      return acc
    }, 0)

    return report?.documents.some(d => d.balance === knpAmount)
  }, [report])

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

  const incomeBankReconciliations = Object.groupBy(report.reconciliations
    .filter((reconciliation) => {
      if (
        reconciliation.bankTransaction &&
        reconciliation.bankTransaction.amount > 0
      ) {
        return true;
      }

      return false;
    })
    .sort(filterByDateReconciliations),
    rec => rec.bankTransactionId!
  );

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
        reconciliation.crmTransaction?.amount
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

  const handleViewReconciliations = (reconciliations: ReconciliationWithRelations[]) => {
    setIsModalReconciliationsDetailOpen(true);
    setCurrentReconciliations(reconciliations);
  }

  const handleViewTransactions = (reconciliation: ReconciliationWithRelations) => {
    setIsModalReconciliationDetailOpen(true);
    setCurrentBankReconciliation(reconciliation);
  }

  const handleModalOpenChange = (open: boolean) => {
    setIsModalReconciliationDetailOpen(open);
  };

  const handleReconciliationCreate = (reconciliation: ReconciliationWithRelations) => {
    setCurrentBankReconciliation(reconciliation)
    setIsModalReconciliationCreateOpen(true);
  };

  const handleModalReconciliationCreateChange = (open: boolean) => {
    setIsModalReconciliationCreateOpen(open);
  }

  const handleCreateReconcile = (reconciliation: ReconciliationWithRelations) => {
    setIsModalReconcileCreateOpen(true);
    setCurrentBankReconciliation(reconciliation)
  }

  const handleModalReconcileCreateChange = (open: boolean) => {
    setIsModalReconcileCreateOpen(open);
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

      await updateReconciliation({
        reconciliationId: currentBankReconciliation.id,
        crmTransactionsIds: pickedCrmTransactions,
        bankTransactionId: currentBankReconciliation.bankTransactionId
      })

      setIsModalReconciliationCreateOpen(false);
      setPickedCrmTransactions([])
      toast.success('Транзакция успешно сверилась');
    }
  }

  // const totalIncome = Object.values(bankReconciliations).reduce((sum, reconciliation) => {
  //   return sum + getTransactionAmount(reconciliation![0]);
  // }, 0);

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
    if (currentBankReconciliation && currentBankReconciliation.bankTransactionId) {
      const crmTransaction = await createTransaction({
        amount: currentBankReconciliation.bankTransaction!.amount,
        documentId: incomeCrmReconciliations[0].crmTransaction!.documentId!,
        meta: {
          'Purpose': values.purpose,
          'Added by': values.addedBy
        },   
      })

      await updateBankReconciliation({
        reconciliationId: currentBankReconciliation.id,
        bankTransactionId: currentBankReconciliation.bankTransactionId,
        crmTransactionId: crmTransaction.id
      });

      setIsModalReconcileCreateOpen(false);
      toast.success('Транзакция успешно сверилась');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Доходы (Продажи)</h2>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          {!isKaspiTransactionsAmountOfDocumentsIsSame && (
            <div className="mb-3 text-red-500">
              <p>
                Сумма из Отчета по продажам не равна сумме Продаж из выписки, проверьте пожалуйста документы!
              </p>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Общая сумма доходов
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {/* {formatBalance(totalIncome)} */}Сделать
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button 
          type="button"
          className={
            `p-2 border border-blue-600 hover:border-blue-700 rounded-xl cursor-pointer ${currentTransactionFilter === 'Kaspi' && 'bg-blue-600'}`
          }
          onClick={() => chooseTypeBank('Kaspi')}
        >
          Kaspi
        </button>
        <button 
          type="button"
          className={
            `p-2 border border-blue-600 hover:border-blue-700 rounded-xl cursor-pointer ${currentTransactionFilter === 'Halyk' && 'bg-blue-600'}`
          }
          onClick={() => chooseTypeBank('Halyk')}
        >
          Halyk
        </button>
        <button 
          type="button"
          className={
            `p-2 border border-blue-600 hover:border-blue-700 rounded-xl cursor-pointer ${currentTransactionFilter === 'CRM' && 'bg-blue-600'}`
          }
          onClick={() => chooseTypeBank('CRM')}
        >
          CRM
        </button>
        <button 
          type="button"
          className={
            `p-2 border border-blue-600 hover:border-blue-700 rounded-xl cursor-pointer ${currentTransactionFilter === 'Cash' && 'bg-blue-600'}`
          }
          onClick={() => chooseTypeBank('Cash')}
        >
          Наличные
        </button>
      </div>

      {Object.values(reconciliations).length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-3">
            Транзакции ({Object.values(reconciliations).length})
          </h3>
          <div className="w-[100%] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.values(reconciliations).map((reconciliations) => (
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
                      notReconciliatedCrmTransactions={notReconciliatedCrmTransactions}
                      pickedCrmTransactions={pickedCrmTransactions}
                      type="bank"
                      isMini={false}
                    />
                  )
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

      <Dialog open={isModalReconciliationsDetailOpen} onOpenChange={(open) => setIsModalReconciliationsDetailOpen(open)}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Транзакции</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] scrollbar-hide">
            {(
              <div>
                <div className="pt-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Банковские метаданные:
                  </h4>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    {currentReconciliations.length && currentReconciliations[0].bankTransaction?.meta &&
                    typeof currentReconciliations[0].bankTransaction.meta === "object" ? (
                      Object.entries(currentReconciliations[0].bankTransaction.meta).map(
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
                  <div className="flex flex-col space-y-3">
                    {currentReconciliations.length && currentReconciliations.map((r, idx) => (
                      <div key={r.crmTransactionId}>
                        {currentReconciliations.length > 1 && <span className="text-sm">{idx + 1}.</span>}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                          {r?.crmTransaction?.meta &&
                          typeof r.crmTransaction.meta === "object" ? (
                            Object.entries(r.crmTransaction.meta).map(
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
                    ))}
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
                      updateReconciliation={updateDataReconciliation}
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

      <Dialog open={isModalReconcileCreateOpen} onOpenChange={handleModalReconcileCreateChange}>
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
                  <Button 
                    size="sm"
                    type="submit"
                  >
                    Сохранить
                  </Button>
                </div>
              </div>
            </form>
          </div>
          <DialogFooter>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
