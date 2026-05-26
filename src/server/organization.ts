import { TRPCError } from "@trpc/server";
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
    .input(
      z.object({
        fullName: z.string(),
        position: z.string().optional(),
        companyName: z.string(),
        bin: z.string().optional(),
        email: z.string().email(),
        phone: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Создаем или обновляем пользователя
      const user = await ctx.prisma.user.upsert({
        where: {
          clerkUserId: ctx.userId,
        },
        create: {
          fullName: input.fullName,
          position: input.position,
          companyName: input.companyName,
          bin: input.bin,
          email: input.email,
          phone: input.phone,
          clerkUserId: ctx.userId,
        },
        update: {
          fullName: input.fullName,
          position: input.position,
          companyName: input.companyName,
          bin: input.bin,
          email: input.email,
          phone: input.phone,
        },
      });

      // Создаем организацию
      const organization = await ctx.prisma.organization.create({
        data: {
          name: input.companyName,
        },
      });

      // Связываем пользователя с организацией
      await ctx.prisma.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
        },
      });

      // Создаем дефолтные типы транзакций
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

      // Sync all DB organizations into Clerk metadata
      const allUserOrgs = await ctx.prisma.userOrganization.findMany({
        where: { user: { clerkUserId: ctx.userId } },
        select: { organizationId: true },
      });
      const allOrgIds = allUserOrgs.map((o) => o.organizationId);

      await ctx.clerk.users.updateUserMetadata(ctx.userId, {
        publicMetadata: {
          organizationIds: allOrgIds,
          currentOrganizationId: organization.id,
        },
      });

      return organization;
    }),

  addUserByEmail: protectedProcedure
    .input(z.object({ email: z.string().email("Некорректный email") }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.organizationId;
      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Сначала выберите организацию",
        });
      }

      const user = await ctx.prisma.user.findFirst({
        where: { email: input.email.toLowerCase().trim() },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Пользователь с таким email не зарегистрирован. Попросите его зарегистрироваться и подтвердить почту.",
        });
      }

      const existing = await ctx.prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: { userId: user.id, organizationId },
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Пользователь уже добавлен в эту компанию",
        });
      }

      await ctx.prisma.userOrganization.create({
        data: { userId: user.id, organizationId },
      });

      const existingMeta = (await ctx.clerk.users.getUser(user.clerkUserId))
        .publicMetadata as { organizationIds?: string[] } | undefined;
      const existingIds = Array.isArray(existingMeta?.organizationIds)
        ? existingMeta.organizationIds
        : [];
      const newIds = existingIds.includes(organizationId)
        ? existingIds
        : [...existingIds, organizationId];

      await ctx.clerk.users.updateUserMetadata(user.clerkUserId, {
        publicMetadata: {
          organizationIds: newIds,
          currentOrganizationId: organizationId,
        },
      });

      return { success: true, userName: user.fullName };
    }),

  clearOrganization: protectedProcedure.mutation(async ({ ctx }) => {
    const existingMeta = (await ctx.clerk.users.getUser(ctx.userId))
      .publicMetadata as {
      organizationIds?: string[];
      currentOrganizationId?: string | null;
    };
    const organizationIds = Array.isArray(existingMeta?.organizationIds)
      ? existingMeta.organizationIds
      : [];
    await ctx.clerk.users.updateUserMetadata(ctx.userId, {
      publicMetadata: {
        organizationIds,
        currentOrganizationId: null,
      },
    });
    return { success: true };
  }),

  setCurrentOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const dbUser = await ctx.prisma.user.findUnique({
        where: { clerkUserId: ctx.userId },
        include: { organizations: { select: { organizationId: true } } },
      });
      if (!dbUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Пользователь не найден" });
      }

      const dbOrgIds = dbUser.organizations.map((o) => o.organizationId);
      if (!dbOrgIds.includes(input.organizationId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к этой организации",
        });
      }

      await ctx.clerk.users.updateUserMetadata(ctx.userId, {
        publicMetadata: {
          organizationIds: dbOrgIds,
          currentOrganizationId: input.organizationId,
        },
      });
      return { success: true };
    }),

  getMembers: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.organizationId;
    if (!organizationId) {
      return [];
    }

    const memberships = await ctx.prisma.userOrganization.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      id: m.user.id,
      membershipId: m.id,
      fullName: m.user.fullName,
      email: m.user.email,
      position: m.user.position,
      phone: m.user.phone,
      joinedAt: m.createdAt,
      clerkUserId: m.user.clerkUserId,
    }));
  }),

  removeMember: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.organizationId;
      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Сначала выберите организацию",
        });
      }

      const currentDbUser = await ctx.prisma.user.findUnique({
        where: { clerkUserId: ctx.userId },
      });
      if (currentDbUser?.id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Нельзя удалить себя из компании",
        });
      }

      const membership = await ctx.prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: { userId: input.userId, organizationId },
        },
        include: { user: true },
      });
      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Сотрудник не найден в этой компании",
        });
      }

      await ctx.prisma.userOrganization.delete({
        where: { id: membership.id },
      });

      try {
        const meta = (await ctx.clerk.users.getUser(membership.user.clerkUserId))
          .publicMetadata as {
          organizationIds?: string[];
          currentOrganizationId?: string | null;
        };
        const newIds = (meta?.organizationIds ?? []).filter(
          (id) => id !== organizationId,
        );
        const newCurrent =
          meta?.currentOrganizationId === organizationId
            ? newIds[0] ?? null
            : meta?.currentOrganizationId ?? null;
        await ctx.clerk.users.updateUserMetadata(membership.user.clerkUserId, {
          publicMetadata: {
            organizationIds: newIds,
            currentOrganizationId: newCurrent,
          },
        });
      } catch {
        // Clerk-метаданные не критичны — оставляем DB-связь удалённой.
      }

      return { success: true };
    }),

  updateMemberPosition: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        position: z.string().max(120),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.organizationId;
      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Сначала выберите организацию",
        });
      }

      const membership = await ctx.prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: { userId: input.userId, organizationId },
        },
      });
      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Сотрудник не найден в этой компании",
        });
      }

      const updated = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { position: input.position.trim() || null },
      });

      return {
        userId: updated.id,
        position: updated.position,
      };
    }),
});

export type OrganizationRouter = typeof organizationRouter;
