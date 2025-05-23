import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";
import { z } from "zod";

export const organizationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string(), xin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organization.create({
        data: {
          name: input.name,
          xin: input.xin,
        },
      });
      await ctx.clerk.users.updateUserMetadata(ctx.userId, {
        publicMetadata: {
          organizationId: organization.id,
        },
      });
      return organization;
    }),
});

export type OrganizationRouter = typeof organizationRouter;
