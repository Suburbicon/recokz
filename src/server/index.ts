import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { organizationRouter } from "./organization";
import { transactionTypeRouter } from "./transaction-type";
import { reportsRouter } from "./reports";
import { documentsRouter } from "./documents";
import { reconciliationRouter } from "./reconciliation";
import { webhookRouter } from "./webhook";

export const appRouter = createTRPCRouter({
  organization: organizationRouter,
  transactionType: transactionTypeRouter,
  reports: reportsRouter,
  documents: documentsRouter,
  reconciliation: reconciliationRouter,
});

export type AppRouter = typeof appRouter;
