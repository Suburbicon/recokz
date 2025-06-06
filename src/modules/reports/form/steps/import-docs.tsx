import { api } from "@/shared/lib/trpc/client";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useCallback, useState } from "react";

export const ImportDocsStepForm = () => {
  const params = useParams<{ id: string }>();
  const utils = api.useUtils();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const { data: report, isLoading } = api.reports.getById.useQuery({
    id: params.id,
  });

  const { mutateAsync: parseDocument, isPending: isParsing } =
    api.documents.parse.useMutation({
      onSuccess: (data) => {
        console.log(data);
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
      "application/pdf": [".pdf"],
      "image/*": [".jpeg", ".jpg", ".png"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Загрузка..." : "Загрузить файлы"}
          </button>
        </div>
      )}
    </div>
  );
};
