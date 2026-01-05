import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { protectedProcedure } from "@/shared/lib/trpc/server";

export const userRouter = createTRPCRouter({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: {
        clerkUserId: ctx.userId,
      },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    return user;
  }),
});

export type UserRouter = typeof userRouter;

