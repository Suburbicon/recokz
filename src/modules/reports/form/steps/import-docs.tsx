import { api } from "@/shared/lib/trpc/client";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useCallback, useState } from "react";
import { Eye, Info, ChevronDown, ChevronUp } from "lucide-react";

export const ImportDocsStepForm = () => {
  const params = useParams<{ id: string }>();
  const utils = api.useUtils();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(
    new Set(),
  );

  const { data: report, isLoading } = api.reports.getById.useQuery({
    id: params.id,
  });

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
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewTransactions = (document: any) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
    setExpandedTransactions(new Set());
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

  const { mutate, isPending } = api.reports.update.useMutation({
    onSuccess: () => {
      utils.reports.getById.invalidate({ id: params.id });
    },
  });

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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Загрузите документы</h2>

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
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between py-4 pl-4 pr-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {document.name}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Баланс: {formatBalance(document.balance)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Транзакций: {document.transactions.length}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Тип: {document.type === "bank" ? "Банк" : "CRM"}
                      </p>
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
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
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
      {isModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Транзакции: {selectedDocument.name}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedDocument.transactions.length > 0 ? (
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
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Всего транзакций: {selectedDocument.transactions.length}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Общий баланс: {formatBalance(selectedDocument.balance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
