import { SidebarProvider } from "@/shared/ui/sidebar";
import { ReportsSidebar } from "./sidebar";
import { CreateReport } from "@/modules/reports/create-report";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ReportsSidebar />
      <main className="w-full">{children}</main>

      {/* Floating Create Report Button */}
      <CreateReport />
    </SidebarProvider>
  );
}
