import type { Metadata } from "next";
import { Geologica } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/shared/providers/theme";
import { Toaster } from "@/shared/ui/sonner";
import { ClerkProvider } from "@/shared/providers/clerk";

const geologica = Geologica({
  variable: "--font-geologica",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "reco.kz - Отслеживайте доходы и расходы каждый день",
  description:
    "Освободите бухгалтеров от ручных пересчетов и бесконечных поисков недочетов.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geologica.variable} antialiased`}>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
