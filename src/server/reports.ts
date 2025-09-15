import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { ReportStatus } from "@prisma/client";
import { z } from "zod";

export const reportsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const report = await ctx.prisma.report.findUnique({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
        include: {
          documents: {
            include: {
              transactions: {
                include: {
                  bankReconciliations: true,
                  crmReconciliations: true,
                },
              },
            },
          },
          reconciliations: {
            include: {
              bankTransaction: {
                include: {
                  document: true,
                },
              },
              crmTransaction: {
                include: {
                  document: true,
                },
              },
              type: true,
            },
          },
        },
      });
      return report;
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const reports = await ctx.prisma.report.findMany({
      where: {
        organizationId: ctx.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return reports;
  }),
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const report = await ctx.prisma.report.create({
      data: {
        startDate: new Date(),
        endDate: new Date(),
        cashBalance: 0,
        status: ReportStatus.import_info,
        organization: {
          connect: {
            id: ctx.organizationId as string,
          },
        },
      },
    });

    return report;
  }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.string().optional(),
        cashBalance: z.number().optional(),
        status: z.nativeEnum(ReportStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date, ...updates } = input;

      const dataToUpdate: {
        cashBalance?: number;
        status?: ReportStatus;
        startDate?: string;
        endDate?: string;
      } = {
        ...updates,
      };

      if (date) {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          const dateInISOString = parsedDate.toISOString();
          
          dataToUpdate.startDate = dateInISOString;
          dataToUpdate.endDate = dateInISOString;
        }
      }

      const report = await ctx.prisma.report.update({
        where: { 
          id,
          organizationId: ctx.organizationId,
        },
        data: dataToUpdate,
      });

      return report;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.report.delete({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
      });
    }),
});
