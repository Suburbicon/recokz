import { api } from "@/shared/lib/trpc/client";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useCallback, useState } from "react";
import { Eye, Info, ChevronDown, ChevronUp, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
import { formatDate } from "@/shared/lib/dayjs";

export const ImportDocsStepForm = () => {
  const params = useParams<{ id: string }>();
  const utils = api.useUtils();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(
    new Set(),
  );
  const [documentCashBalances, setDocumentCashBalances] = useState<
    Record<string, number>
  >({});

  const { data: documents, isLoading: isLoadingDocuments } =
    api.documents.getAll.useQuery({
      reportId: params.id,
    });

  const { mutateAsync: parseDocument, isPending: isParsing } =
    api.documents.parse.useMutation({
      onSuccess: (data) => {
        console.log(data);
        // Invalidate documents query to refresh the list
        utils.documents.getAll.invalidate({ reportId: params.id });
        // Clear uploaded files after successful parse
        setUploadedFiles([]);
      },
    });

  const { mutateAsync: deleteDocument, isPending: isDeleting } =
    api.documents.delete.useMutation({
      onSuccess: () => {
        // Invalidate documents query to refresh the list
        utils.documents.getAll.invalidate({ reportId: params.id });
      },
    });

  const { mutateAsync: updateDocument, isPending: isUpdating } =
    api.documents.update.useMutation({
      onSuccess: () => {
        // Invalidate documents query to refresh the list
        utils.documents.getAll.invalidate({ reportId: params.id });
      },
    });

  const { mutateAsync: updateReport } = api.reports.update.useMutation({
    onSuccess: () => {
      utils.reports.getById.invalidate({ id: params.id });
    },
  });

  const { mutateAsync: reconcile, isPending: isReconciling } =
    api.reconciliation.reconcile.useMutation({
      onSuccess: async (data) => {
        console.log(data);
        // Update report status to sales and invalidate report
        try {
          await updateReport({
            id: params.id,
            status: "sales",
          });
        } catch (error) {
          console.error("Failed to update report status:", error);
        }
      },
    });

  const handleParse = async () => {
    try {
      for (const file of uploadedFiles) {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        await parseDocument({
          reportId: params.id,
          fileContent: base64,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument({ id: documentId });
      // Remove from local state
      setDocumentCashBalances((prev) => {
        const newState = { ...prev };
        delete newState[documentId];
        return newState;
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewTransactions = (document: any) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setExpandedTransactions(new Set());
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedDocument(null);
      setExpandedTransactions(new Set());
    }
  };

  const toggleTransactionMeta = (transactionId: string) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatBalance = (balanceInKopecks: number) => {
    return (balanceInKopecks / 100).toLocaleString("ru-RU", {
      style: "currency",
      currency: "KZT",
      minimumFractionDigits: 2,
    });
  };

  const handleDocumentTypeChange = async (
    documentId: string,
    newType: "bank" | "crm",
  ) => {
    try {
      await updateDocument({
        id: documentId,
        type: newType,
      });

      // If changing from bank to CRM, remove cash balance from state
      if (newType === "crm") {
        setDocumentCashBalances((prev) => {
          const newState = { ...prev };
          delete newState[documentId];
          return newState;
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCashBalanceChange = (documentId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setDocumentCashBalances((prev) => ({
      ...prev,
      [documentId]: numValue,
    }));
  };

  const handleCashBalanceBlur = async (documentId: string) => {
    const cashBalance = documentCashBalances[documentId] || 0;
    try {
      // update cash balance, it is balance field in db, it is kopecks
      const balanceInKopecks = Math.round(cashBalance * 100);
      await updateDocument({
        id: documentId,
        balance: balanceInKopecks,
      });
    } catch (error) {
      console.error("Failed to update cash balance:", error);
    }
  };

  const handleReconcile = async () => {
    try {
      await reconcile({ reportId: params.id });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Загрузите документы</h2>
        <p className="mb-6">Выгрузка с банков и CRM-систем</p>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20"
                : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <div className="text-gray-600 dark:text-gray-300">
              {isDragActive ? (
                <p>Отпустите файлы здесь...</p>
              ) : (
                <div>
                  <p className="text-lg">
                    Перетащите файлы сюда или нажмите для выбора
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Поддерживаемые форматы: Excel
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Загруженные файлы:</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 pl-3 pr-6 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleParse}
            disabled={isParsing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? "Обработка..." : "Обработать файлы"}
          </button>
        </div>
      )}

      {/* Downloaded documents list */}
      {isLoadingDocuments ? (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">
            Загрузка документов...
          </p>
        </div>
      ) : documents && documents.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-3">Обработанные документы:</h3>
          <div className="space-y-3">
            {documents.map((document: any) => (
              <div
                key={document.id}
                className="py-4 pl-4 pr-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {document.name}
                      </p>
                      <div className="flex items-center space-x-8 mt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Баланс: {formatBalance(document.balance * 100)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Транзакций: {document.transactions.length}
                        </p>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          Тип:
                          <Select
                            value={document.type}
                            onValueChange={(value) =>
                              handleDocumentTypeChange(
                                document.id,
                                value as "bank" | "crm",
                              )
                            }
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="w-20 h-6 text-xs ml-1 inline-flex">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank">Банк</SelectItem>
                              <SelectItem value="crm">CRM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewTransactions(document)}
                      className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                      title="Просмотреть транзакции"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? "Удаление..." : "Удалить"}
                    </button>
                  </div>
                </div>

                {/* Initial Cash Input for Bank Documents */}
                {document.type === "bank" && (
                  <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        Начальный остаток наличных:
                      </label>
                      <div className="flex-1 max-w-xs">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={documentCashBalances[document.id] || ""}
                          onChange={(e) =>
                            handleCashBalanceChange(document.id, e.target.value)
                          }
                          onBlur={() => handleCashBalanceBlur(document.id)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ₸
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-0">
                      Укажите сумму наличных средств на начало периода для этого
                      банковского счета
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleReconcile}
              disabled={isReconciling}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReconciling ? "Сверка..." : "Сверить"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Нет обработанных документов
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Загрузите и обработайте файлы для их отображения здесь
            </p>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Транзакции: {selectedDocument?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] scrollbar-hide">
            {selectedDocument?.transactions.length > 0 ? (
              <div className="space-y-3">
                {selectedDocument.transactions.map(
                  (transaction: any, index: number) => (
                    <div
                      key={transaction.id || index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden"
                    >
                      <div className="flex items-center justify-between py-3 px-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(transaction.date)}
                            </span>
                            <span
                              className={`font-medium ${
                                transaction.amount >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {formatBalance(transaction.amount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              toggleTransactionMeta(transaction.id)
                            }
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                            title="Показать метаданные"
                          >
                            {expandedTransactions.has(transaction.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      {expandedTransactions.has(transaction.id) && (
                        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="pt-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Метаданные:
                            </h4>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                              {transaction.meta &&
                              typeof transaction.meta === "object" ? (
                                Object.entries(transaction.meta).map(
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
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  В этом документе нет транзакций
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Всего транзакций: {selectedDocument?.transactions.length || 0}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Общий баланс:{" "}
                {selectedDocument
                  ? formatBalance(selectedDocument.balance * 100)
                  : ""}
              </span>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
