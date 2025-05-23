import { createTRPCRouter } from "@/shared/lib/trpc/server";
import { organizationRouter } from "./organization";

export const appRouter = createTRPCRouter({
  organization: organizationRouter,
});

export type AppRouter = typeof appRouter;
