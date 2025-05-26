import { createSearchParamsCache } from "nuqs/server";
import { parseAsStringLiteral } from "nuqs";

export const reportsTabCache = createSearchParamsCache({
  tab: parseAsStringLiteral(["all", "in_progress", "done"]).withDefault("all"),
});
