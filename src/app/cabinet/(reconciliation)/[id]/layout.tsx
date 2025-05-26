import { SidebarProvider } from "@/shared/ui/sidebar";
import { ReconciliationSidebar } from "./sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ReconciliationSidebar />
      <main className="w-full">{children}</main>
    </SidebarProvider>
  );
}
