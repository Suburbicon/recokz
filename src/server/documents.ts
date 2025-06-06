import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { parse } from "@/shared/lib/parse";
import { ai } from "@/server/ai";
import { parseDateTime } from "@/shared/lib/parse-date-time";
import { parseAmount } from "@/shared/lib/amount";

export const documentsRouter = createTRPCRouter({
  parse: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        fileName: z.string(),
        fileContent: z.string(), // base64 encoded file content
        fileSize: z.number(),
        mimeType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const supportedMimeTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
          "application/vnd.ms-excel", // .xls
        ];

        if (!supportedMimeTypes.includes(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Неподдерживаемый тип файла: ${input.mimeType}. Поддерживаются только Excel файлы.`,
          });
        }

        const maxFileSize = 3 * 1024 * 1024; // 3MB
        if (input.fileSize > maxFileSize) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Файл слишком большой. Максимальный размер: ${maxFileSize / 1024 / 1024}MB`,
          });
        }

        const report = await ctx.prisma.report.findUnique({
          where: {
            id: input.reportId,
            organizationId: ctx.organizationId,
          },
        });

        if (!report) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Отчет не найден или у вас нет доступа к нему",
          });
        }

        let fileBuffer: Buffer;
        try {
          fileBuffer = Buffer.from(input.fileContent, "base64");
          console.log(
            "File decoded successfully. Buffer size:",
            fileBuffer.length,
            "bytes",
          );
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ошибка декодирования файла. Проверьте формат файла.",
          });
        }

        if (Math.abs(fileBuffer.length - input.fileSize) > 100) {
          console.warn("File size mismatch:", {
            expected: input.fileSize,
            actual: fileBuffer.length,
          });
        }

        const rows = await parse(fileBuffer);
        const previewRows = rows.slice(0, 20);

        const startRow = await ai.detectTableStartRow(previewRows);
        const bank = await ai.detectBank(input.fileName);

        const headerRow = rows[startRow];
        const exampleDataRow = [rows[startRow + 1], rows[startRow + 2]];
        const dataRow = rows[startRow + 1];

        const columnsMap = await ai.detectTableColumns(headerRow);

        console.log("columnsMap", columnsMap);

        const data = rows.reduce<
          {
            date: string;
            amount: number;
            meta: Record<string, string | number>;
          }[]
        >((acc, row, index) => {
          if (index < startRow + 1) return acc;
          if (!row[columnsMap.date]) return acc;

          const hasAmount = Array.isArray(columnsMap.amount)
            ? columnsMap.amount.some((idx) => !!row[idx])
            : !!row[columnsMap.amount];

          if (!hasAmount) return acc;

          const parsedDate = parseDateTime(
            row[columnsMap.date],
            row[columnsMap.time],
          );

          if (!parsedDate) return acc;

          const amount = parseAmount(
            row,
            columnsMap.amount,
            columnsMap.isIncome,
          );

          acc.push({
            date: parsedDate.toISOString(),
            amount,
            meta: row.reduce(
              (meta, item, i) => {
                if (i === columnsMap.date) {
                  meta[headerRow[i]] = parsedDate.toISOString();
                } else if (i === columnsMap.time) {
                  meta[headerRow[i]] = parsedDate.format("HH:mm:ss");
                } else if (i === columnsMap.amount) {
                  meta[headerRow[i]] = amount;
                } else {
                  meta[headerRow[i]] = item;
                }
                return meta;
              },
              {} as Record<string, string | number>,
            ),
          });
          return acc;
        }, []);

        return {
          success: true,
          message: "Файл успешно получен и проверен",
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          bufferSize: fileBuffer.length,
          data,
        };
      } catch (error) {
        console.error("Error processing file:", error);

        // Re-throw TRPCError as-is
        if (error instanceof TRPCError) {
          throw error;
        }

        // Wrap other errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Ошибка при обработке файла",
          cause: error,
        });
      }
    }),

  getAll: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ ctx, input }) => {
      const documents = await ctx.prisma.document.findMany({
        where: {
          reportId: input.reportId,
          report: {
            organizationId: ctx.organizationId,
          },
        },
        include: {
          transactions: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return documents;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: {
          id: input.id,
          report: {
            organizationId: ctx.organizationId,
          },
        },
        include: {
          transactions: {
            include: {
              bankReconciliations: true,
              crmReconciliations: true,
            },
          },
          report: true,
        },
      });
      return document;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.document.delete({
        where: {
          id: input.id,
          report: {
            organizationId: ctx.organizationId,
          },
        },
      });
    }),
});
