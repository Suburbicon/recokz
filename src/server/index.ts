import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { organizationRouter } from "./organization";
import { transactionTypeRouter } from "./transaction-type";
import { reportsRouter } from "./reports";

export const appRouter = createTRPCRouter({
  organization: organizationRouter,
  transactionType: transactionTypeRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
