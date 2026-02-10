import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/shared/lib/trpc/server";
import { decryptString, encryptString } from "@/server/lib/encryption";

export const rekassaRouter = createTRPCRouter({
  saveCredentials: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        token: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organizationId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const encryptedId = encryptString(input.id);
      const encryptedToken = encryptString(input.token);

      await ctx.prisma.conf.upsert({
        where: { organizationId: ctx.organizationId },
        create: {
          organizationId: ctx.organizationId,
          rekassaIdEncrypted: encryptedId,
          rekassaTokenEncrypted: encryptedToken,
        },
        update: {
          rekassaIdEncrypted: encryptedId,
          rekassaTokenEncrypted: encryptedToken,
        },
      });
    }),
  getCredentials: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const conf = await ctx.prisma.conf.findUnique({
      where: { organizationId: ctx.organizationId },
    });

    if (!conf?.rekassaIdEncrypted || !conf?.rekassaTokenEncrypted) {
      return null;
    }

    return {
      id: decryptString(conf.rekassaIdEncrypted),
      token: decryptString(conf.rekassaTokenEncrypted),
    };
  }),
});
