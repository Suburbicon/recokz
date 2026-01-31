import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/shared/ui/dialog";
import { ReconciliationWithRelations } from "../import-sales";

export const ReconciliationDetailModal = ({
  isModalReconciliationsDetailOpen,
  setIsModalReconciliationsDetailOpen,
  currentReconciliations,
}: {
  isModalReconciliationsDetailOpen: boolean;
  setIsModalReconciliationsDetailOpen: (open: boolean) => void;
  currentReconciliations: ReconciliationWithRelations[];
}) => {
  return (
    <Dialog
      open={isModalReconciliationsDetailOpen}
      onOpenChange={(open) => setIsModalReconciliationsDetailOpen(open)}
    >
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Транзакции</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] scrollbar-hide">
          {
            <div>
              <div className="pt-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Банковские метаданные:
                </h4>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                  {currentReconciliations?.length &&
                  currentReconciliations[0].bankTransaction?.meta &&
                  typeof currentReconciliations[0].bankTransaction.meta ===
                    "object" ? (
                    Object.entries(
                      currentReconciliations[0].bankTransaction.meta,
                    ).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-start"
                      >
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {key}:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100 text-right max-w-xs">
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
                <div className="flex flex-col space-y-3">
                  {currentReconciliations?.length &&
                    currentReconciliations.map((r, idx) => (
                      <div key={r.crmTransactionId}>
                        {currentReconciliations.length > 1 && (
                          <span className="text-sm">{idx + 1}.</span>
                        )}
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
          }
        </div>
        <DialogFooter>
          <div className="flex justify-between items-center w-full"></div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};