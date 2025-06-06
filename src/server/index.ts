import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { organizationRouter } from "./organization";
import { transactionTypeRouter } from "./transaction-type";
import { reportsRouter } from "./reports";
import { documentsRouter } from "./documents";

export const appRouter = createTRPCRouter({
  organization: organizationRouter,
  transactionType: transactionTypeRouter,
  reports: reportsRouter,
  documents: documentsRouter,
});

export type AppRouter = typeof appRouter;
