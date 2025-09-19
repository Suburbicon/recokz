import { useState } from 'react';
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

export const ReconciliationRowV2 = ({
    reconciliations,
    transactionTypes,
    updateReconciliation,
    isUpdatingReconciliation,
    handleViewReconciliations,
    handleReconciliationCreate,
    pickedCrmTransactions,
    handlePickCrmTransactions,
    type,
    isMini,
    notReconciliatedCrmTransactions
} : {
    reconciliations: ReconciliationWithRelations[],
    transactionTypes: any,
    updateReconciliation: any,
    isUpdatingReconciliation: boolean,
    handleViewReconciliations: any,
    handleReconciliationCreate: any,
    pickedCrmTransactions?: any,
    handlePickCrmTransactions?: any,
    type: 'bank' | 'crm',
    isMini: boolean,
    notReconciliatedCrmTransactions: ReconciliationWithRelations[]
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const formatBalance = (balanceInKopecks: number) => {
        return (balanceInKopecks / 100).toLocaleString("ru-RU", {
        style: "currency",
        currency: "KZT",
        minimumFractionDigits: 2,
        });
    };

    const isMatched = (reconciliations: ReconciliationWithRelations[]) => {
        return reconciliations.every(r => r.bankTransaction && r.crmTransaction);
    };

    const isResolved = (reconciliations: ReconciliationWithRelations[]) => {
        // Consider resolved if it's either fully matched OR has a transaction type assigned
        return isMatched(reconciliations) || !!reconciliations[0].typeId;
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

    const getIconAndBgColor = (reconciliations: ReconciliationWithRelations[]) => {
        if (isResolved(reconciliations)) {
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

    const getStatusText = (reconciliations: ReconciliationWithRelations[]) => {
        if (isMatched(reconciliations)) {
        return "Сверено";
        } else if (reconciliations[0].typeId) {
        return "Сверено";
        } else {
        return "Не сверено";
        }
    };

    const getStatusColor = (reconciliations: ReconciliationWithRelations[]) => {
        if (isResolved(reconciliations)) {
        return "text-green-600 dark:text-green-400";
        } else {
        return "text-yellow-600 dark:text-yellow-400";
        }
    };

    const getTransactionAmount = (reconciliations: ReconciliationWithRelations[], typeReconciliation: 'bank' | 'crm') => {
        // Prefer bank transaction amount, fallback to CRM transaction amount
        if (typeReconciliation === 'bank') {
            if (
                reconciliations[0].bankTransaction &&
                reconciliations[0].bankTransaction.amount > 0
            ) {
                return reconciliations[0].bankTransaction.amount;
            }
            return 0;
        }
        
        return reconciliations.reduce((acc, val) => {
            if (val.crmTransaction) {
                acc += val.crmTransaction.amount
            }
            return acc
        }, 0);
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

    const getSourceAndType = (reconciliations: any) => {
        const source =
        reconciliations.every((r: any) => r.bankTransaction && r.crmTransaction)
            ? "Банк + CRM"
            : reconciliations[0].bankTransaction
            ? reconciliations[0].bankTransaction.document.name
            : "CRM";

        const typeName = getTransactionTypeName(reconciliations[0].typeId);

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
            className="flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center justify-between p-2 bg-gray-600 rounded-xl space-x-4 text-base">
                    <div className="flex flex-col">
                        <span className="text-sm">
                            {formatDate(getTransactionDate(reconciliations[0]))}
                        </span>
                        <span className="font-bold">
                            {formatBalance(
                                getTransactionAmount(reconciliations, 'bank'),
                            )}
                        </span>
                        <span>
                            
                        </span>
                    </div>
                    <Button size="sm" onClick={() => handleViewReconciliations(reconciliations)}>
                        Детали
                    </Button>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            getIconAndBgColor(reconciliations).bg
                        }`}
                    >
                        {getIconAndBgColor(reconciliations).icon}
                    </div>
                    <div className="flex flex-col items-center text-xs">
                        <p
                            className={`font-medium ${getStatusColor(reconciliations)}`}
                        >
                            {getStatusText(reconciliations)}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                            {getSourceAndType(reconciliations)}
                        </p>
                    </div>
                </div>
                <div>
                    {reconciliations.some(r => !r.crmTransactionId) ? (
                        <div className="flex flex justify-between p-2 bg-gray-600 rounded-xl text-base space-x-4">
                            <Button size="sm" onClick={() => handleReconciliationCreate(reconciliations[0])}>
                                Сверить
                            </Button>
                            <Button size="sm" onClick={() => {}}>
                                Создать
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-between p-2 bg-gray-600 rounded-xl text-base">
                            <div className="flex items-center justify-between space-x-4">
                                <div className="flex flex-col">
                                    <span className="text-sm">
                                        {formatDate(getTransactionDate(reconciliations[0]))}
                                    </span>
                                    <span className="font-bold">
                                        {formatBalance(
                                            getTransactionAmount(reconciliations, 'crm'),
                                        )}
                                    </span>
                                </div>
                                <Button size="sm" onClick={() => handleViewReconciliations(reconciliations)}>
                                    Детали
                                </Button>
                            </div>
                            {reconciliations.length > 1 && 
                                <span className="mt-2">
                                    {`Состоит из ${reconciliations.length} транзакций CRM`}
                                </span>
                            }
                        </div>
                    )}
                </div>
                {/* <div className="flex items-center space-x-3 flex-1 min-w-0">
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

                        <Button size="sm" onClick={() => handleViewTransactions(reconciliation)}>
                            Детали
                        </Button>

                        {(!isResolved(reconciliation) && type === 'bank') && (
                            <Button size="sm" onClick={() => handleReconciliationCreate(reconciliation)}>
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
                                <SelectTrigger className="w-32 h-7 text-xs">
                                    <SelectValue placeholder="Тип" />
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
                </div> */}
            </div>
        </div>
    )
}