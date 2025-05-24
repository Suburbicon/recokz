import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { organizationRouter } from "./organization";
import { transactionTypeRouter } from "./transaction-type";

export const appRouter = createTRPCRouter({
  organization: organizationRouter,
  transactionType: transactionTypeRouter,
});

export type AppRouter = typeof appRouter;
