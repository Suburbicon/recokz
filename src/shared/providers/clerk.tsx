import { ClerkProvider as NextClerkProvider } from "@clerk/nextjs";
import { PropsWithChildren } from "react";
import { ruRU } from "@clerk/localizations";

export function ClerkProvider({ children }: PropsWithChildren) {
  return <NextClerkProvider localization={ruRU}>{children}</NextClerkProvider>;
}
