import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { z } from "zod";

const DEFAULT_INCOME_TYPES = [
  "Поступления от продажи товаров/услуг",
  "Предоплата за товары/услуги",
  "Взносы учредителей",
  "Получение кредита",
  "Возврат подотчётных средств",
];

const DEFAULT_EXPENSE_TYPES = [
  "Налоги выплаченные",
  "Заработная плата",
  "Аренда помещений",
  "Банковская комиссия",
  "Консультационные и профессиональные услуги",
  "Маркетинговые расходы",
  "Представительские расходы",
  "Командировочные расходы",
  "Транспортные расходы",
  "Коммунальные расходы",
  "Програмное обеспечение",
  "Канцелярские товары и хоз нужды",
  "Обучение сотрудников",
  "Страхование",
  "Выдача в подотчет",
];

export const organizationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organization.create({
        data: {
          name: input.name,
        },
      });

      const defaultTransactionTypes = [
        ...DEFAULT_INCOME_TYPES.map((name) => ({
          name,
          category: "income" as const,
          organizationId: organization.id,
        })),
        ...DEFAULT_EXPENSE_TYPES.map((name) => ({
          name,
          category: "expense" as const,
          organizationId: organization.id,
        })),
      ];

      await ctx.prisma.transactionType.createMany({
        data: defaultTransactionTypes,
      });

      await ctx.clerk.users.updateUserMetadata(ctx.userId, {
        publicMetadata: {
          organizationId: organization.id,
        },
      });
      return organization;
    }),

  clearOrganization: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.clerk.users.updateUserMetadata(ctx.userId, {
      publicMetadata: {
        organizationId: null,
      },
    });
    return { success: true };
  }),
});

export type OrganizationRouter = typeof organizationRouter;
