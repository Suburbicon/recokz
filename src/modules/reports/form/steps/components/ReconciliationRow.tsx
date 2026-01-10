import { CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Prisma, Transaction, TransactionType } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { CustomCheckbox } from "@/shared/ui/checkbox";

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

export const ReconciliationRow = ({
  reconciliation,
  transactionTypes,
  updateReconciliation,
  isUpdatingReconciliation,
  handleViewTransactions,
  handleReconciliationCreate,
  pickedCrmTransactions,
  handlePickCrmTransactions,
  type,
  isMini,
}: {
  reconciliation: ReconciliationWithRelations;
  transactionTypes: any;
  updateReconciliation: any;
  isUpdatingReconciliation: boolean;
  handleViewTransactions: any;
  handleReconciliationCreate: any;
  pickedCrmTransactions?: any;
  handlePickCrmTransactions?: any;
  type: "bank" | "crm";
  isMini: boolean;
}) => {
  const formatBalance = (balanceInKopecks: number) => {
    return (balanceInKopecks / 100).toLocaleString("ru-RU", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 2,
    });
  };

  const isMatched = (reconciliation: any) => {
    return reconciliation.bankTransaction && reconciliation.crmTransaction;
  };

  const isResolved = (reconciliation: any) => {
    // Consider resolved if it's either fully matched OR has a transaction type assigned
    return isMatched(reconciliation) || !!reconciliation.typeId;
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

  const getIconAndBgColor = (reconciliation: any) => {
    if (isResolved(reconciliation)) {
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        icon: (
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        ),
      };
    } else if (reconciliation.crmTransaction?.meta.byCash) {
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        icon: (
          <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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

  const getStatusText = (reconciliation: any) => {
    if (isMatched(reconciliation)) {
      return "Сверено";
    } else if (reconciliation.typeId) {
      return "Сверено";
    } else if (reconciliation.crmTransaction?.meta.byCash) {
      return "Наличными";
    } else {
      return "Не сверено";
    }
  };

  const getStatusColor = (reconciliation: any) => {
    if (isResolved(reconciliation)) {
      return "text-green-600 dark:text-green-400";
    } else if (reconciliation.crmTransaction?.meta.byCash) {
      return "text-blue-600 dark:text-blue-400";
    } else {
      return "text-yellow-600 dark:text-yellow-400";
    }
  };

  const getTransactionAmount = (reconciliation: any) => {
    // Prefer bank transaction amount, fallback to CRM transaction amount
    if (type === "bank") {
      if (reconciliation.bankTransaction) {
        return reconciliation.bankTransaction.amount;
      }
      return 0;
    }
    if (reconciliation.crmTransaction) {
      return reconciliation.crmTransaction.amount;
    }
    return 0;
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

  const getTransactionTypeName = (typeId: string | null) => {
    if (!typeId || !transactionTypes) return null;
    const type = transactionTypes.find((t: any) => t.id === typeId);
    return type?.name || null;
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

  return (
    <div
      key={reconciliation.id}
      className="flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
    >
      {!isMini ? (
        <div className="flex items-center justify-between w-full">
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
                      {formatBalance(getTransactionAmount(reconciliation))}
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

                <Button
                  size="sm"
                  onClick={() => handleViewTransactions(reconciliation)}
                >
                  Детали
                </Button>

                {!isResolved(reconciliation) && type === "bank" && (
                  <Button
                    size="sm"
                    onClick={() => handleReconciliationCreate(reconciliation)}
                  >
                    Сверить
                  </Button>
                )}

                {!isResolved(reconciliation) && (
                  <div className="flex-shrink-0">
                    <Select
                      value={reconciliation.typeId || ""}
                      onValueChange={(value) =>
                        handleTypeChange(reconciliation.id, value)
                      }
                      disabled={isUpdatingReconciliation}
                    >
                      <SelectTrigger className="w-36 h-7 text-xs">
                        <SelectValue placeholder="Классификация" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionTypes?.map((type: any) => (
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
      ) : (
        <div>
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <CustomCheckbox
                id={reconciliation.id}
                name={reconciliation.id}
                label=""
                checked={pickedCrmTransactions.includes(
                  reconciliation.crmTransactionId,
                )}
                onChange={(e) =>
                  handlePickCrmTransactions(reconciliation.crmTransactionId)
                }
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatBalance(getTransactionAmount(reconciliation))}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(getTransactionDate(reconciliation))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => handleViewTransactions(reconciliation)}
            >
              Детали
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
