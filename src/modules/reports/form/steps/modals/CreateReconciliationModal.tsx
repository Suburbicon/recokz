import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { ReconciliationWithRelations } from "../import-sales";
import { ReconciliationRow } from "../components/ReconciliationRow";
import { formatBalance } from "../lib/format-balance";

export const CreateReconciliationModal = ({
  isModalReconciliationCreateOpen,
  handleModalReconciliationCreateChange,
  currentBankReconciliation,
  notReconciliatedCrmTransactions,
  handleCreateNewReconciliation,
  transactionTypes,
  updateDataReconciliation,
  isUpdatingReconciliation,
  handleViewTransactions,
  handleReconciliationCreate,
  pickedCrmTransactions,
  handlePickCrmTransactions,
}: {
  isModalReconciliationCreateOpen: boolean;
  handleModalReconciliationCreateChange: (open: boolean) => void;
  currentBankReconciliation: ReconciliationWithRelations | undefined;
  notReconciliatedCrmTransactions: ReconciliationWithRelations[];
  handleCreateNewReconciliation: () => void;
  transactionTypes: any;
  updateDataReconciliation: (reconciliation: any) => void;
  isUpdatingReconciliation: boolean;
  handleViewTransactions: (reconciliation: ReconciliationWithRelations) => void;
  handleReconciliationCreate: (reconciliation: ReconciliationWithRelations) => void;
  pickedCrmTransactions: string[];
  handlePickCrmTransactions: (transactionId: string) => void;
}) => {
  return (
    <Dialog
      open={isModalReconciliationCreateOpen}
      onOpenChange={handleModalReconciliationCreateChange}
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

          <p className="my-2 text-lg font-bold">CRM транзакции</p>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notReconciliatedCrmTransactions?.map((reconciliation) => (
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
            <Button size="sm" onClick={handleCreateNewReconciliation}>
              Сохранить
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};