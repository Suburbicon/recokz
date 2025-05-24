import { SidebarProvider } from "@/shared/ui/sidebar";
import { ReportsSidebar } from "./sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ReportsSidebar />
      <main className="w-full">{children}</main>
    </SidebarProvider>
  );
}
